'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { useRouter } from '@/navigation';

import { CloseIcon, InfoIcon } from '@/components/icons';
import { type Question } from '@bigfive-org/questions';
import { sleep, formatTimer, isDev } from '@/lib/helpers';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import useTimer from '@/hooks/useTimer';
import { type Answer } from '@/types';

interface SurveyProps {
  questions: Question[];
  nextText: string;
  prevText: string;
  resultsText: string;
  saveTest: Function;
  language: string;
}

export const Survey = ({
  questions,
  nextText,
  prevText,
  resultsText,
  saveTest,
  language
}: SurveyProps) => {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionsPerPage, setQuestionsPerPage] = useState(1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const { width } = useWindowDimensions();
  const seconds = useTimer();

  useEffect(() => {
    const handleResize = () => {
      setQuestionsPerPage(window.innerWidth > 768 ? 3 : 1);
    };
    handleResize();
  }, [width]);

  useEffect(() => {
    if (dataInLocalStorage()) {
      restoreDataFromLocalStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestions = useMemo(
    () =>
      questions.slice(
        currentQuestionIndex,
        currentQuestionIndex + questionsPerPage
      ),
    [currentQuestionIndex, questions, questionsPerPage]
  );

  const isTestDone = questions.length === answers.length;
  const progress = Math.round((answers.length / questions.length) * 100);

  const nextButtonDisabled =
    inProgress ||
    currentQuestionIndex + questionsPerPage > answers.length ||
    (isTestDone &&
      currentQuestionIndex === questions.length - questionsPerPage) ||
    loading;

  const backButtonDisabled = currentQuestionIndex === 0 || loading;

  async function handleAnswer(id: string, value: string) {
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    const newAnswer: Answer = {
      id,
      score: Number(value),
      domain: question.domain,
      facet: question.facet
    };

    setAnswers((prev) => [...prev.filter((a) => a.id !== id), newAnswer]);

    const latestAnswerId = answers.slice(-1)[0]?.id;

    if (
      questionsPerPage === 1 &&
      questions.length !== answers.length + 1 &&
      id !== latestAnswerId
    ) {
      setInProgress(true);
      await sleep(700);
      setCurrentQuestionIndex((prev) => prev + 1);
      window.scrollTo(0, 0);
      setInProgress(false);
    }
    populateDataInLocalStorage();
  }

  function handlePreviousQuestions() {
    setCurrentQuestionIndex((prev) => prev - questionsPerPage);
    window.scrollTo(0, 0);
  }

  function handleNextQuestions() {
    if (inProgress) return;
    setCurrentQuestionIndex((prev) => prev + questionsPerPage);
    window.scrollTo(0, 0);
    if (restored) setRestored(false);
  }

  function skipToEnd() {
    const randomAnswers = questions
      .map((q) => ({
        id: q.id,
        score: Math.floor(Math.random() * 5) + 1,
        domain: q.domain,
        facet: q.facet
      }))
      .slice(0, questions.length - 1);

    setAnswers([...randomAnswers]);
    setCurrentQuestionIndex(questions.length - 1);
  }

  async function submitTest() {
    setLoading(true);
    confetti({});
    const result = await saveTest({
      testId: 'b5-120',
      lang: language,
      invalid: false,
      timeElapsed: seconds,
      dateStamp: new Date(),
      answers
    });
    localStorage.removeItem('inProgress');
    localStorage.removeItem('b5data');
    localStorage.setItem('resultId', result.id);
    router.push(`/result/${result.id}`);
  }

  function dataInLocalStorage() {
    return !!localStorage.getItem('inProgress');
  }

  function populateDataInLocalStorage() {
    localStorage.setItem('inProgress', 'true');
    localStorage.setItem(
      'b5data',
      JSON.stringify({ answers, currentQuestionIndex })
    );
  }

  function restoreDataFromLocalStorage() {
    const raw = localStorage.getItem('b5data');
    if (raw) {
      const { answers, currentQuestionIndex } = JSON.parse(raw);
      setAnswers(answers);
      setCurrentQuestionIndex(currentQuestionIndex);
      setRestored(true);
    }
  }

  function clearDataInLocalStorage() {
    localStorage.removeItem('inProgress');
    localStorage.removeItem('b5data');
    location.reload();
  }

  return (
    <div className="mt-2">
      {/* Top progress + timer in Taroscoper style */}
      <div className="panel panel--pad" style={{ marginBottom: '1rem' }}>
        <div className="bar" style={{ marginBottom: '0.5rem' }}>
          <div className="chip">
            <span>Progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="chip">
            <span>Time</span>
            <strong>{formatTimer(seconds)}</strong>
          </div>
        </div>
        <div
          aria-label="Progress bar"
          className="cardframe"
          style={{
            height: 14,
            padding: 0,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--gold)',
              transition: 'width 240ms ease'
            }}
          />
        </div>
      </div>

      {/* Restored notice */}
      {restored && (
        <div
          className="panel"
          style={{
            padding: '0.5rem 0.75rem',
            marginBottom: '1rem',
            borderColor: 'rgba(214,178,94,0.45)'
          }}
        >
          <div className="bar">
            <span className="chip" aria-hidden>
              <InfoIcon />
              Restored
            </span>
            <p style={{ margin: 0 }}>
              Your answers have been restored. Click here to{' '}
              <a
                className="underline"
                onClick={clearDataInLocalStorage}
                aria-label="Clear data"
              >
                start a new test
              </a>
              .
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => setRestored(false)}
              aria-label="Dismiss"
              style={{ padding: '6px 8px' }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      {/* Questions */}
      {currentQuestions.map((question) => {
        const selected = answers.find((a) => a.id === question.id)?.score;
        return (
          <div key={'q' + question.num} className="cardframe" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <h2 className="title" style={{ color: 'var(--ink)', marginBottom: '0.75rem' }}>
              {question.text}
            </h2>

            <fieldset>
              <legend className="sr-only">{question.text}</legend>
              <div className="grid gap-2">
                {question.choices.map((choice, index) => {
                  const value = choice.score;
                  const isSelected = Number(selected) === value;
                  return (
                    <label
                      key={index + question.id}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition',
                        isSelected
                          ? 'border-[rgba(214,178,94,0.9)]'
                          : 'border-[rgba(0,0,0,0.25)] hover:bg-[rgba(0,0,0,0.05)]'
                      )}
                      style={{ color: 'var(--ink)', background: isSelected ? 'rgba(214,178,94,0.08)' : 'transparent' }}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`q-${question.id}`}
                        value={value}
                        checked={isSelected}
                        onChange={() => handleAnswer(question.id, String(value))}
                        disabled={inProgress}
                        aria-label={choice.text}
                      />
                      <span
                        aria-hidden
                        className="h-3 w-3 rounded-full border flex items-center justify-center"
                        style={{
                          borderColor: isSelected ? 'var(--gold)' : 'rgba(0,0,0,0.45)'
                        }}
                      >
                        {isSelected && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: 'var(--gold)' }}
                          />
                        )}
                      </span>
                      <span>{choice.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        );
      })}

      {/* Nav buttons */}
      <div className="btn-row" style={{ marginTop: '1.5rem' }}>
        <button
          type="button"
          className="btn btn--bronze"
          onClick={handlePreviousQuestions}
          disabled={backButtonDisabled}
        >
          {prevText.toUpperCase()}
        </button>

        <button
          type="button"
          className="btn btn--gold"
          onClick={handleNextQuestions}
          disabled={nextButtonDisabled}
        >
          {nextText.toUpperCase()}
        </button>

        {isTestDone && (
          <button
            type="button"
            className="btn btn--gold"
            onClick={submitTest}
            disabled={loading}
          >
            {loading ? 'SAVING…' : resultsText.toUpperCase()}
          </button>
        )}

        {isDev && !isTestDone && (
          <button type="button" className="btn btn--bronze" onClick={skipToEnd}>
            Skip to end (dev)
          </button>
        )}
      </div>
    </div>
  );
};