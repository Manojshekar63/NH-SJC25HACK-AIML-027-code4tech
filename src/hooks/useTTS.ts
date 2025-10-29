import { useCallback, useEffect, useRef, useState } from "react";

export type UseTTSOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceHint?: string; // exact name preferred, else language substring like 'en'
};

export type UseTTSReturn = {
  speak: (text: string) => void;
  stop: () => void;
  toggle: (text: string) => void;
  speaking: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  setVoiceByName: (nameOrLang: string) => void;
};

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const { rate = 1.0, pitch = 1.0, volume = 1.0, voiceHint } = options;

  const synthesisRef = useRef<typeof window.speechSynthesis | null>(
    typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null
  );
  const [supported] = useState<boolean>(!!synthesisRef.current);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const loadVoices = useCallback(() => {
    const synth = synthesisRef.current;
    if (!synth) return;
    const v = synth.getVoices();
    if (v && v.length) {
      setVoices(v);
      // Select voice by hint
      if (!selectedVoiceRef.current) {
        let chosen: SpeechSynthesisVoice | null = null;
        if (voiceHint) {
          chosen = v.find((vv) => vv.name === voiceHint) || null;
          if (!chosen) chosen = v.find((vv) => vv.lang?.toLowerCase().includes(voiceHint.toLowerCase())) || null;
        }
        if (!chosen) chosen = v.find((vv) => vv.lang?.toLowerCase().startsWith("en")) || null;
        selectedVoiceRef.current = chosen || v[0] || null;
      }
    }
  }, [voiceHint]);

  useEffect(() => {
    if (!supported) return;
    loadVoices();
    const handler = () => loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
    };
  }, [supported, loadVoices]);

  const setVoiceByName = useCallback((nameOrLang: string) => {
    if (!voices.length) return;
    let found = voices.find((v) => v.name === nameOrLang) || null;
    if (!found) found = voices.find((v) => v.lang?.toLowerCase().includes(nameOrLang.toLowerCase())) || null;
    if (found) selectedVoiceRef.current = found;
  }, [voices]);

  // Keep speaking state in sync
  useEffect(() => {
    const synth = synthesisRef.current;
    if (!synth) return;
    const interval = setInterval(() => {
      setSpeaking(synth.speaking);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const stop = useCallback(() => {
    const synth = synthesisRef.current;
    if (!synth) return;
    synth.cancel();
    setSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback((text: string) => {
    const synth = synthesisRef.current;
    if (!synth || !text?.trim()) return;

    // If currently speaking, restart with new text
    if (synth.speaking) synth.cancel();

    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = rate;
    ut.pitch = pitch;
    ut.volume = volume;
    if (selectedVoiceRef.current) ut.voice = selectedVoiceRef.current;

    ut.onend = () => setSpeaking(false);
    ut.onerror = () => setSpeaking(false);

    utteranceRef.current = ut;
    synth.speak(ut);
    setSpeaking(true);
  }, [pitch, rate, volume]);

  const toggle = useCallback((text: string) => {
    const synth = synthesisRef.current;
    if (!synth) return;
    if (synth.speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    speak(text);
  }, [speak]);

  // Cleanup on unmount
  useEffect(() => stop, [stop]);

  return { speak, stop, toggle, speaking, supported, voices, setVoiceByName };
}
