import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertCircle, ArrowLeftRight, BookOpen, Bot, Check, ChevronDown, Clipboard, Languages, Lightbulb, MessageCircle, Send, Sparkles, Square, Volume2, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type LanguageCode = 'en' | 'te' | 'hi' | 'fr' | 'es' | 'de';
type StatusKind = 'idle' | 'error' | 'success' | 'info';

type Language = {
  code: LanguageCode;
  name: string;
  native: string;
  locale: string;
};

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English', locale: 'en-US' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', locale: 'te-IN' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', locale: 'hi-IN' },
  { code: 'fr', name: 'French', native: 'Français', locale: 'fr-FR' },
  { code: 'es', name: 'Spanish', native: 'Español', locale: 'es-ES' },
  { code: 'de', name: 'German', native: 'Deutsch', locale: 'de-DE' },
];

const EXAMPLES = [
  { label: 'A warm hello', text: 'It is lovely to meet you.' },
  { label: 'Make a plan', text: 'What time should we meet tomorrow?' },
  { label: 'Show gratitude', text: 'Thank you for helping me today.' },
];

function decodeHtml(value: string) {
  if (typeof document === 'undefined') return value;
  const area = document.createElement('textarea');
  area.innerHTML = value;
  return area.value;
}

function LanguageSelect({
  value,
  onChange,
  label,
}: {
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  label: string;
}) {
  return (
    <div className="language-select-wrap">
      <label className="sr-only" htmlFor={`${label}-language`}>{label} language</label>
      <select
        id={`${label}-language`}
        className="language-select"
        data-testid={`select-${label}-language`}
        value={value}
        onChange={(event) => onChange(event.target.value as LanguageCode)}
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name} · {language.native}
          </option>
        ))}
      </select>
      <ChevronDown className="select-chevron" size={15} aria-hidden="true" />
    </div>
  );
}

function StatusMessage({ kind, message }: { kind: StatusKind; message: string }) {
  if (kind === 'idle' || !message) return null;
  const Icon = kind === 'error' ? AlertCircle : kind === 'success' ? Check : Lightbulb;
  return (
    <div className={`status-message ${kind}`} role={kind === 'error' ? 'alert' : 'status'} aria-live="polite" data-testid={`status-${kind}`}>
      <Icon size={16} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

function LoadingDots() {
  return <span className="loading-dots" aria-label="Translating"><i /><i /><i /></span>;
}

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
};

const FAQ_SUGGESTIONS = [
  'How do I translate?',
  'Which languages are supported?',
  'Is this tool free?',
];

function getFaqAnswer(question: string) {
  const normalized = question.toLowerCase();

  if (normalized.includes('language') || normalized.includes('support') || normalized.includes('telugu') || normalized.includes('hindi') || normalized.includes('french') || normalized.includes('spanish') || normalized.includes('german')) {
    return 'lingonear supports English, Telugu, Hindi, French, Spanish, and German. Choose a source and target language above, then write your phrase.';
  }
  if (normalized.includes('copy') || normalized.includes('clipboard')) {
    return 'After translating, tap Copy beneath the result. You will see a confirmation when the translation is on your clipboard.';
  }
  if (normalized.includes('listen') || normalized.includes('speech') || normalized.includes('sound') || normalized.includes('read aloud')) {
    return 'After a translation appears, tap Listen to hear it aloud. The available voice depends on your browser and device.';
  }
  if (normalized.includes('free') || normalized.includes('cost') || normalized.includes('api') || normalized.includes('pay')) {
    return 'Yes. lingonear uses a free translation service for short phrases, so no account or API key is needed.';
  }
  if (normalized.includes('phone') || normalized.includes('mobile') || normalized.includes('work')) {
    return 'Yes. The workspace is designed for phones. Open it in your mobile browser and use the large controls as usual.';
  }
  if (normalized.includes('translate') || normalized.includes('how') || normalized.includes('start')) {
    return 'Write your phrase in the “You write” box, choose the source and target languages, and tap Translate phrase. Your result will appear on the right or below.';
  }
  return 'I can help with translating, supported languages, Copy, Listen, free use, and mobile access. Try one of the questions below.';
}

function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', text: 'Hi, I’m the lingonear guide. What would you like to know?' },
  ]);
  const nextId = useRef(2);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const askQuestion = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const answer = getFaqAnswer(trimmed);
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: 'user', text: trimmed },
      { id: nextId.current++, role: 'assistant', text: answer },
    ]);
    setQuestion('');
  };

  return (
    <div className={`faq-chat ${isOpen ? 'is-open' : ''}`}>
      {isOpen && (
        <section className="faq-window" role="dialog" aria-modal="false" aria-labelledby="faq-title">
          <div className="faq-window-head">
            <div className="faq-agent">
              <span className="faq-agent-mark"><Bot size={17} aria-hidden="true" /></span>
              <div>
                <h2 id="faq-title">lingonear guide</h2>
                <span>Quick answers about the tool</span>
              </div>
            </div>
            <button className="faq-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close FAQ chatbot">
              <X size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="faq-messages" aria-live="polite">
            {messages.map((message) => (
              <p className={`faq-message ${message.role}`} key={message.id}>{message.text}</p>
            ))}
          </div>
          <div className="faq-suggestions" aria-label="Frequently asked questions">
            {FAQ_SUGGESTIONS.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => askQuestion(suggestion)}>{suggestion}</button>
            ))}
          </div>
          <form className="faq-form" onSubmit={(event) => { event.preventDefault(); askQuestion(question); }}>
            <label className="sr-only" htmlFor="faq-question">Ask a question</label>
            <input
              ref={inputRef}
              id="faq-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question…"
              autoComplete="off"
            />
            <button type="submit" aria-label="Send FAQ question" disabled={!question.trim()}>
              <Send size={15} aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
      <button className="faq-launcher" type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="faq-title">
        {isOpen ? <X size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}
        <span>{isOpen ? 'Close' : 'FAQ help'}</span>
      </button>
    </div>
  );
}

function Home() {
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('en');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('te');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [statusKind, setStatusKind] = useState<StatusKind>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setStatus = useCallback((kind: StatusKind, message: string) => {
    setStatusKind(kind);
    setStatusMessage(message);
  }, []);

  const translate = useCallback(async () => {
    const phrase = sourceText.trim();
    setIsCopied(false);
    if (!phrase) {
      setTranslatedText('');
      setStatus('error', 'Write a phrase first, then we will find the right words together.');
      sourceRef.current?.focus();
      return;
    }
    if (sourceLanguage === targetLanguage) {
      setTranslatedText(phrase);
      setStatus('success', 'These are already the same language, so your phrase is ready to use.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsTranslating(true);
    setTranslatedText('');
    setStatus('info', 'Finding the closest natural phrasing…');

    try {
      const params = new URLSearchParams({
        q: phrase,
        langpair: `${sourceLanguage}|${targetLanguage}`,
      });
      const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Translation service unavailable');
      const payload: unknown = await response.json();
      const data = payload as { responseStatus?: number; responseData?: { translatedText?: string } };
      const result = data.responseData?.translatedText?.trim();
      if (!result || data.responseStatus === 401) throw new Error('No translation was returned');
      const safeResult = decodeHtml(result);
      setTranslatedText(safeResult);
      setStatus('success', 'Translation ready. Read it aloud or make it yours.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setTranslatedText('');
      setStatus('error', 'We could not reach the translation service. Check your connection and try again.');
    } finally {
      setIsTranslating(false);
    }
  }, [setStatus, sourceLanguage, sourceText, targetLanguage]);

  const swapLanguages = useCallback(() => {
    const previousSource = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(previousSource);
    if (translatedText.trim()) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
      setStatus('info', 'Languages swapped. Your last translation is ready to translate back.');
    } else {
      setStatus('info', 'Languages swapped. Your phrase stays right where you left it.');
    }
    setIsCopied(false);
  }, [setStatus, sourceLanguage, sourceText, targetLanguage, translatedText]);

  const copyTranslation = useCallback(async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setIsCopied(true);
      setStatus('success', 'Copied to your clipboard.');
      window.setTimeout(() => setIsCopied(false), 2200);
    } catch {
      setStatus('error', 'Clipboard access is unavailable here. Select the text to copy it manually.');
    }
  }, [setStatus, translatedText]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setStatus('info', 'Reading paused.');
  }, [setStatus]);

  const speakTranslation = useCallback(() => {
    if (!translatedText) return;
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setStatus('error', 'Text-to-speech is not available in this browser.');
      return;
    }
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const language = LANGUAGES.find((item) => item.code === targetLanguage);
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = language?.locale ?? targetLanguage;
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(targetLanguage));
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus('success', `Reading your translation in ${language?.name ?? 'the selected language'}.`);
    };
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatus('error', 'This browser could not read the translation aloud.');
    };
    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, setStatus, stopSpeaking, targetLanguage, translatedText]);

  useEffect(() => () => {
    abortRef.current?.abort();
    window.speechSynthesis?.cancel();
  }, []);

  const selectExample = (text: string) => {
    setSourceText(text);
    setTranslatedText('');
    setStatus('info', 'A small starting point. Edit it or translate as-is.');
    window.setTimeout(() => sourceRef.current?.focus(), 0);
  };

  return (
    <main className="translation-app">
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-lockup" aria-label="Lingo near home">
            <div className="brand-mark" aria-hidden="true"><Languages size={20} strokeWidth={2.3} /></div>
            <div className="brand-name">lingo<span>near</span></div>
          </div>
          <div className="topbar-note"><span className="status-dot" aria-hidden="true" />A quiet place for better words</div>
        </header>

        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> Translation workspace</p>
            <h1 id="page-title">Say it<br /><em>closer.</em></h1>
            <p className="hero-copy">Short phrases, thoughtful translations, and a little more understanding between one language and the next.</p>
          </div>
          <aside className="hero-aside">
            <p>“The right words can make a new place feel familiar.”</p>
            <small>made for curious conversations</small>
          </aside>
        </section>

        <section className="workspace" aria-label="Translation workspace">
          <article className="panel source-panel">
            <div className="panel-head">
              <div className="panel-label"><BookOpen size={16} aria-hidden="true" /> You write</div>
              <LanguageSelect value={sourceLanguage} onChange={setSourceLanguage} label="source" />
            </div>
            <div className="source-area">
              <textarea
                ref={sourceRef}
                className="source-textarea"
                data-testid="input-source-text"
                aria-label="Text to translate"
                placeholder="Write a short phrase here…"
                value={sourceText}
                onChange={(event) => {
                  setSourceText(event.target.value);
                  if (statusKind !== 'idle') setStatusKind('idle');
                }}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    event.preventDefault();
                    void translate();
                  }
                }}
                maxLength={500}
              />
              <div className="source-foot">
                <span>{sourceText.length}/500</span>
                {sourceText && (
                  <button className="text-button" data-testid="button-clear-source" type="button" onClick={() => { setSourceText(''); setTranslatedText(''); sourceRef.current?.focus(); }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </article>

          <div className="swap-row">
            <button className="swap-button" data-testid="button-swap-languages" type="button" onClick={swapLanguages} aria-label="Swap source and target languages" title="Swap languages">
              <ArrowLeftRight size={19} aria-hidden="true" />
            </button>
          </div>

          <article className="panel output-panel">
            <div className="panel-head">
              <div className="panel-label"><Sparkles size={16} aria-hidden="true" /> It becomes</div>
              <LanguageSelect value={targetLanguage} onChange={setTargetLanguage} label="target" />
            </div>
            <div className="output-body">
              {isTranslating ? (
                <p className="translated-text muted" data-testid="text-translation-loading">Listening for the right words <LoadingDots /></p>
              ) : translatedText ? (
                <p className="translated-text" data-testid="text-translated-result" aria-live="polite">{translatedText}</p>
              ) : (
                <p className="translated-text muted" data-testid="text-translation-empty">Your translation will appear here, with room to breathe.</p>
              )}
              <div className="output-actions">
                <button className={`icon-button ${isCopied ? 'success' : ''}`} data-testid="button-copy-translation" type="button" onClick={() => void copyTranslation()} disabled={!translatedText} aria-label="Copy translated text">
                  {isCopied ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
                <button className="icon-button" data-testid="button-speak-translation" type="button" onClick={speakTranslation} disabled={!translatedText} aria-label={isSpeaking ? 'Stop reading translation' : 'Read translation aloud'}>
                  {isSpeaking ? <Square size={14} fill="currentColor" aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
                  {isSpeaking ? 'Stop' : 'Listen'}
                </button>
              </div>
            </div>
          </article>
        </section>

        <div className="translate-row">
          <button className="primary-button" data-testid="button-translate" type="button" onClick={() => void translate()} disabled={isTranslating}>
            {isTranslating ? <><LoadingDots /> Translating</> : <><Send size={17} aria-hidden="true" /> Translate phrase</>}
          </button>
        </div>

        <StatusMessage kind={statusKind} message={statusMessage} />

        <section className="helper-strip" aria-label="Helpful examples">
          <div className="helper-copy"><Lightbulb size={15} aria-hidden="true" /><span><strong>Not sure where to start?</strong> Try a phrase below.</span></div>
          <div className="examples">
            {EXAMPLES.map((example) => (
              <button className="example-chip" data-testid={`button-example-${example.label.toLowerCase().replaceAll(' ', '-')}`} type="button" key={example.label} onClick={() => selectExample(example.text)}>
                {example.label}
              </button>
            ))}
          </div>
        </section>

        <footer className="footer-note">
          <span>6 languages · short phrases · free to use</span>
          <span>Ctrl / Cmd + Enter to translate</span>
        </footer>
      </div>
       <FAQChatbot />
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;