// lib/extract-document-helpers.ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Mistral } from '@mistralai/mistralai';
import { generateText } from 'ai';
import { mistral } from '@ai-sdk/mistral';
import { logOperation } from "./utils";

export interface ExtractedContent {
  text: string;
  fileUrl: string;
  fileType: 'audio' | 'image' | 'pdf';
}

/**
 * Determines file type based on URL extension
 */
export function getFileType(url: string): 'audio' | 'image' | 'pdf' | 'unknown' {
  const extension = url.toLowerCase().split('.').pop();

  if (extension === 'mp3' || extension === 'wav' || extension === 'm4a') {
    return 'audio';
  }

  if (extension === 'pdf') {
    return 'pdf';
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
    return 'image';
  }

  return 'unknown';
}

/**
 * Extracts text from audio files using ElevenLabs transcription
 */
export async function extractTextFromAudio(fileUrl: string): Promise<string> {
  try {
    logOperation('extract-text-audio', 'Starting audio transcription', { fileUrl });

    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });

    // Fetch the audio file
    logOperation('extract-text-audio', 'Fetching audio file from URL', { fileUrl });
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }

    const audioBlob = new Blob([await response.arrayBuffer()], {
      type: "audio/mp3"
    });
    logOperation('extract-text-audio', 'Audio file fetched successfully', {
      fileUrl,
      blobSize: audioBlob.size
    });

    logOperation('extract-text-audio', 'Starting ElevenLabs transcription', {
      fileUrl,
      modelId: "scribe_v1"
    });
    const transcription = await elevenlabs.speechToText.convert({
      file: audioBlob,
      modelId: "scribe_v1",
      tagAudioEvents: true,
      languageCode: "eng",
      diarize: true,
    });

    const extractedText = transcription.text || '';
    logOperation('extract-text-audio', 'Audio transcription completed', {
      fileUrl,
      textLength: extractedText.length
    });

    return extractedText;
  } catch (error) {
    logOperation('extract-text-audio', 'Audio transcription failed', {
      fileUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`Failed to extract text from audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts text from images using Mistral Vision API
 */
export async function extractTextFromImage(fileUrl: string): Promise<string> {
  try {
    logOperation('extract-text-image', 'Starting image text extraction', { fileUrl });

    const client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY
    });

    logOperation('extract-text-image', 'Processing image with Mistral Vision API', {
      fileUrl,
      model: "pixtral-12b"
    });

    const chatResponse = await client.chat.complete({
      model: "pixtral-12b",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all the text from this image. Return only the text content without any additional commentary or formatting."
            },
            {
              type: "image_url",
              imageUrl: fileUrl,
            },
          ],
        },
      ],
    });

    const messageContent = chatResponse.choices[0]?.message?.content || '';

    // Handle both string and ContentChunk[] responses
    const extractedText = typeof messageContent === 'string'
      ? messageContent
      : messageContent.map(chunk => chunk.type === 'text' ? chunk.text : '').join('');

    logOperation('extract-text-image', 'Image text extraction completed', {
      fileUrl,
      textLength: extractedText.length
    });

    return extractedText;
  } catch (error) {
    logOperation('extract-text-image', 'Image text extraction failed', {
      fileUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts text from PDFs using Mistral OCR
 */
export async function extractTextFromPdf(fileUrl: string): Promise<string> {
  try {
    logOperation('extract-text-pdf', 'Starting PDF OCR', { fileUrl });

    const client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY
    });

    logOperation('extract-text-pdf', 'Processing PDF with Mistral OCR', {
      fileUrl,
      model: "mistral-ocr-latest"
    });
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: fileUrl
      },
      includeImageBase64: true
    });

    const extractedText = ocrResponse.documentAnnotation || '';
    logOperation('extract-text-pdf', 'PDF OCR completed', {
      fileUrl,
      textLength: extractedText.length
    });

    return extractedText;
  } catch (error) {
    logOperation('extract-text-pdf', 'PDF OCR failed', {
      fileUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts text from a single file based on its type
 */
export async function extractTextFromFile(fileUrl: string): Promise<ExtractedContent> {
  const fileType = getFileType(fileUrl);
  logOperation('extract-text-file', 'Extracting text from file', { fileUrl, fileType });

  let text: string;

  switch (fileType) {
    case 'audio':
      text = await extractTextFromAudio(fileUrl);
      break;
    case 'image':
      text = await extractTextFromImage(fileUrl);
      break;
    case 'pdf':
      text = await extractTextFromPdf(fileUrl);
      break;
    default:
      logOperation('extract-text-file', 'Unsupported file type detected', { fileUrl, fileType });
      throw new Error(`Unsupported file type for URL: ${fileUrl}`);
  }

  logOperation('extract-text-file', 'Text extraction completed for file', {
    fileUrl,
    fileType,
    textLength: text.length
  });

  return {
    text,
    fileUrl,
    fileType
  };
}

/**
 * Extracts text from multiple files
 */
export async function extractTextFromFiles(fileUrls: string[]): Promise<ExtractedContent[]> {
  logOperation('extract-text-files', 'Starting batch text extraction', {
    fileCount: fileUrls.length,
    fileUrls
  });

  const extractionPromises = fileUrls.map(url => extractTextFromFile(url));
  const results = await Promise.all(extractionPromises);

  logOperation('extract-text-files', 'Batch text extraction completed', {
    fileCount: fileUrls.length,
    totalTextLength: results.reduce((sum, content) => sum + content.text.length, 0)
  });

  return results;
}

/**
 * Converts extracted text to CSV using Mistral LLM
 */
export async function convertTextToCsv(
  extractedContents: ExtractedContent[],
  columnNames?: string[],
  context?: string
): Promise<string> {
  logOperation('text-to-csv', 'Starting text to CSV conversion', {
    contentCount: extractedContents.length,
    hasColumnNames: !!columnNames,
    hasContext: !!context
  });

  // Combine all extracted text
  const combinedText = extractedContents
    .map(content => `File: ${content.fileUrl} (${content.fileType})\n${content.text}`)
    .join('\n\n---\n\n');

  logOperation('text-to-csv', 'Combined text prepared for LLM', {
    combinedTextLength: combinedText.length
  });

  // Build the prompt
  let prompt = `You are an expert data extraction assistant. Your task is to analyze the provided text content and convert it into a structured CSV format.

TEXT CONTENT TO ANALYZE:
${combinedText}

INSTRUCTIONS:
1. Extract structured data from the above text content
2. Create a CSV format with headers in the first row
3. Each subsequent row should contain the extracted data points
4. Ensure the CSV is properly formatted with commas separating values
5. If a value contains commas, wrap it in double quotes
6. Return ONLY the CSV content, no additional text or explanations`;

  if (columnNames && columnNames.length > 0) {
    prompt += `\n7. Use these specific column names: ${columnNames.join(', ')}`;
    logOperation('text-to-csv', 'Using specified column names', { columnNames });
  }

  if (context) {
    prompt += `\n8. Additional context: ${context}`;
    logOperation('text-to-csv', 'Using additional context', { context });
  }

  prompt += `\n\nReturn the CSV data starting with the header row:`;
  prompt += `\n\nYou must wrap the csv in \`\`\`csv \n \`\`\``;

  try {
    const model = process.env.MODEL || 'mistral-medium-latest'
    logOperation('text-to-csv', 'Calling Mistral LLM for CSV generation', {
      model: model,
      promptLength: prompt.length
    });

    let { text } = await generateText({
      model: mistral(model),
      prompt,
      maxTokens: 4000,
    });

    text = stripCsvWrapperRobust(text)

    logOperation('text-to-csv', 'CSV generation completed', {
      outputLength: text.trim().length
    });

    return text.trim();
  } catch (error) {
    logOperation('text-to-csv', 'CSV generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`Failed to convert text to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function stripCsvWrapper(input: string): string {
  // Remove leading and trailing whitespace
  const trimmed = input.trim();

  // Check if it starts with ```csv and ends with ```
  if (trimmed.startsWith('```csv') && trimmed.endsWith('```')) {
    // Remove the opening ```csv and closing ```
    let result = trimmed.slice(6); // Remove '```csv'
    result = result.slice(0, -3); // Remove closing '```'

    // Remove any leading/trailing whitespace or newlines
    return result.trim();
  }

  // If no wrapper found, return the original string
  return input;
}

// Alternative more robust version that handles various markdown code block formats
function stripCsvWrapperRobust(input: string): string {
  const trimmed = input.trim();

  // Match various CSV code block patterns
  const patterns = [
    /^```csv\s*\n([\s\S]*?)\n```$/,  // ```csv\n...\n```
    /^```csv\s*([\s\S]*?)```$/,      // ```csv...```
    /^```\s*csv\s*\n([\s\S]*?)\n```$/,  // ``` csv\n...\n```
    /^```\s*([\s\S]*?)\n```$/        // Generic ```...\n```
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // If no pattern matches, return original
  return input;
}

/**
 * Main function to extract and process documents
 */
export async function extractAndProcessDocuments(
  fileUrls: string[],
  columnNames?: string[],
  context?: string
): Promise<{
  csvData: string;
  jsonData: Record<string, string>[];
  dataPoints: number;
}> {
  logOperation('extract-process-docs', 'Starting document extraction and processing', {
    fileUrls,
    columnNames,
    context
  });

  // Extract text from all files
  const extractedContents = await extractTextFromFiles(fileUrls);

  // Convert to CSV using LLM
  const csvData = await convertTextToCsv(extractedContents, columnNames, context);

  logOperation('extract-process-docs', 'Starting CSV to JSON parsing', {
    csvLength: csvData.length
  });

  // Parse CSV to JSON
  const lines = csvData.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());

  const jsonData = lines.slice(1).map(line => {
    // Simple CSV parsing - for production, consider using a proper CSV parser
    const values = line.split(',').map(value => value.replace(/"/g, '').trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || '';
      return obj;
    }, {} as Record<string, string>);
  });

  logOperation('extract-process-docs', 'Document extraction and processing completed', {
    dataPoints: headers.length,
    recordCount: jsonData.length,
    headers
  });

  return {
    csvData,
    jsonData,
    dataPoints: headers.length
  };
}
