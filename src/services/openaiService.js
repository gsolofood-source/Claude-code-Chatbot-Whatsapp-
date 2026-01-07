import OpenAI from 'openai';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { promises as fs } from 'fs';
import path from 'path';

class OpenAIService {
  constructor() {
    // Forza l'uso della configurazione dal .env, ignorando le variabili d'ambiente di sistema
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: 'https://api.openai.com/v1',
      dangerouslyAllowBrowser: false
    });
    this.assistantId = config.openai.assistantId;

    logger.debug(`OpenAI client initialized with API key: ${config.openai.apiKey.substring(0, 10)}...`);

    // Cache dei thread per utente (phone number -> thread ID)
    this.userThreads = new Map();

    // Path al file di persistenza
    this.threadsFilePath = path.join(process.cwd(), 'data', 'user_threads.json');

    // Carica i thread salvati all'avvio
    this.loadThreads();
  }

  /**
   * Carica i thread salvati dal file JSON
   */
  async loadThreads() {
    try {
      // Crea la directory data se non esiste
      const dataDir = path.dirname(this.threadsFilePath);
      await fs.mkdir(dataDir, { recursive: true });

      // Leggi il file se esiste
      const data = await fs.readFile(this.threadsFilePath, 'utf-8');
      const threads = JSON.parse(data);

      // Carica in memoria
      this.userThreads = new Map(Object.entries(threads));
      logger.info(`Loaded ${this.userThreads.size} thread(s) from persistent storage`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('No existing threads file found, starting fresh');
      } else {
        logger.warn('Error loading threads:', error.message);
      }
    }
  }

  /**
   * Salva i thread su file JSON
   */
  async saveThreads() {
    try {
      // Converti Map in oggetto per JSON
      const threadsObj = Object.fromEntries(this.userThreads);

      // Salva su file
      await fs.writeFile(
        this.threadsFilePath,
        JSON.stringify(threadsObj, null, 2),
        'utf-8'
      );

      logger.debug(`Saved ${this.userThreads.size} thread(s) to persistent storage`);
    } catch (error) {
      logger.error('Error saving threads:', error.message);
    }
  }

  /**
   * Ottieni o crea un thread per un utente
   */
  async getOrCreateThread(userId) {
    try {
      // Se esiste già un thread per questo utente, usalo
      if (this.userThreads.has(userId)) {
        const threadId = this.userThreads.get(userId);
        logger.debug(`Using existing thread ${threadId} for user ${userId}`);
        return threadId;
      }

      // Crea un nuovo thread
      const thread = await this.client.beta.threads.create();
      this.userThreads.set(userId, thread.id);
      logger.info(`Created new thread ${thread.id} for user ${userId}`);

      // Salva su file per persistenza
      await this.saveThreads();

      return thread.id;
    } catch (error) {
      logger.error('Error getting/creating thread:', error.message);
      throw error;
    }
  }

  /**
   * Invia un messaggio all'Assistant e ottieni la risposta
   */
  async getResponse(userId, userMessage) {
    try {
      // Ottieni o crea il thread per questo utente
      const threadId = await this.getOrCreateThread(userId);

      // Aggiungi il messaggio dell'utente al thread
      await this.client.beta.threads.messages.create(threadId, {
        role: 'user',
        content: userMessage
      });

      logger.debug(`Message added to thread ${threadId}: "${userMessage.substring(0, 50)}..."`);

      // Esegui l'assistant sul thread
      const run = await this.client.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId
      });

      logger.debug(`Run created: ${run.id}`);

      // Attendi il completamento del run
      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      if (completedRun.status !== 'completed') {
        throw new Error(`Run failed with status: ${completedRun.status}`);
      }

      // Recupera i messaggi dal thread
      const messages = await this.client.beta.threads.messages.list(threadId);

      // Prendi il messaggio più recente dell'assistant
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

      if (!assistantMessage) {
        throw new Error('No assistant message found in thread');
      }

      // Estrai il testo dal messaggio
      const responseText = assistantMessage.content
        .filter(content => content.type === 'text')
        .map(content => content.text.value)
        .join('\n');

      logger.info(`OpenAI response generated: "${responseText.substring(0, 50)}..."`);

      return responseText;
    } catch (error) {
      logger.error('Error getting OpenAI response:', error.message);
      throw error;
    }
  }

  /**
   * Attendi il completamento di un run
   */
  async waitForRunCompletion(threadId, runId, maxAttempts = 30) {
    let attempts = 0;

    logger.debug(`waitForRunCompletion called with threadId: ${threadId}, runId: ${runId}`);

    while (attempts < maxAttempts) {
      // L'API di OpenAI Assistants v2 richiede il formato: retrieve(runId, { thread_id })
      const run = await this.client.beta.threads.runs.retrieve(runId, { thread_id: threadId });

      if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
        return run;
      }

      // Attendi 1 secondo prima di controllare di nuovo
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Run timeout: max attempts reached');
  }

  /**
   * Reset del thread per un utente (per ricominciare la conversazione)
   */
  async resetThread(userId) {
    if (this.userThreads.has(userId)) {
      this.userThreads.delete(userId);
      logger.info(`Thread reset for user ${userId}`);

      // Salva su file per persistenza
      await this.saveThreads();
    }
  }

  /**
   * Trascrivi un file audio usando Whisper
   */
  async transcribeAudio(audioBuffer, filename = 'audio.ogg') {
    try {
      // Crea un File object dal buffer
      const file = new File([audioBuffer], filename, { type: 'audio/ogg' });

      const transcription = await this.client.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'it' // Italiano
      });

      logger.info(`Audio transcribed: "${transcription.text.substring(0, 50)}..."`);
      return transcription.text;
    } catch (error) {
      logger.error('Error transcribing audio:', error.message);
      throw error;
    }
  }

  /**
   * Analizza un'immagine usando GPT-4 Vision
   */
  async analyzeImage(imageBuffer, userPrompt = "Analizza questa immagine come se fossi Joe Bastianich, lo chef e ristoratore. Dai un feedback professionale e diretto.") {
    try {
      // Converti il buffer in base64
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Sei Joe Bastianich, famoso chef, ristoratore e giudice di MasterChef Italia. Rispondi sempre in italiano con il tuo stile diretto, professionale e a volte provocatorio. Dai feedback onesti e costruttivi sul cibo e la presentazione dei piatti."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const analysis = response.choices[0].message.content;
      logger.info(`Image analyzed: "${analysis.substring(0, 50)}..."`);
      return analysis;
    } catch (error) {
      logger.error('Error analyzing image:', error.message);
      throw error;
    }
  }
}

export default new OpenAIService();
