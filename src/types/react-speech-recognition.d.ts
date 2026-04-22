declare module "react-speech-recognition" {
  export interface ListeningOptions {
    continuous?: boolean;
    language?: string;
  }

  export function useSpeechRecognition(options?: {
    transcribing?: boolean;
    clearTranscriptOnListen?: boolean;
  }): {
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
    browserSupportsContinuousListening: boolean;
    isMicrophoneAvailable: boolean;
  };

  const SpeechRecognition: {
    startListening(options?: ListeningOptions): Promise<void>;
    stopListening(): Promise<void>;
    abortListening(): Promise<void>;
    browserSupportsSpeechRecognition(): boolean;
  };

  export default SpeechRecognition;
}
