'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

interface QuizAnswer {
  id: string;
  answer_text: string;
  sort_order: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'multiple_select' | 'free_text';
  points: number;
  sort_order: number;
  quiz_answers: QuizAnswer[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
  show_correct_answers: boolean;
  allow_retakes: boolean;
  max_attempts: number | null;
  quiz_questions: QuizQuestion[];
}

interface QuizAttempt {
  id: string;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  passed: boolean | null;
}

interface AttemptAnswer {
  id: string;
  question_id: string;
  selected_answer_id: string;
  is_correct: boolean;
  quiz_questions: {
    id: string;
    question_text: string;
    explanation: string | null;
    quiz_answers: QuizAnswer[];
  };
}

interface SubmissionResult {
  attempt: QuizAttempt;
  results: AttemptAnswer[] | null;
}

interface UserAnswers {
  [questionId: string]: string | string[];
}

type QuizState = 'loading' | 'error' | 'cannot_attempt' | 'start' | 'taking' | 'submitting' | 'completed';

interface QuizPlayerProps {
  quizId: string;
  onComplete?: (passed: boolean, score: number) => void;
}

export function QuizPlayer({ quizId, onComplete }: QuizPlayerProps) {
  const [state, setState] = useState<QuizState>('loading');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [canAttempt, setCanAttempt] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchQuiz = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error ?? 'Failed to load quiz');
        setState('error');
        return;
      }
      const data = await res.json();
      setQuiz(data.quiz);
      setAttempts(data.attempts ?? []);
      setCanAttempt(data.can_attempt);
      setAttemptsRemaining(data.attempts_remaining);
      if (!data.can_attempt) {
        setState('cannot_attempt');
      } else {
        setState('start');
      }
    } catch {
      setErrorMessage('Failed to load quiz. Please try again.');
      setState('error');
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  async function startAttempt() {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error ?? 'Failed to start quiz');
        setState('error');
        return;
      }
      const data = await res.json();
      setCurrentAttemptId(data.attempt.id);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setState('taking');
    } catch {
      setErrorMessage('Failed to start quiz. Please try again.');
      setState('error');
    }
  }

  async function submitQuiz() {
    if (!currentAttemptId || !quiz) return;
    setState('submitting');

    const answers = quiz.quiz_questions.map((q) => {
      const answer = userAnswers[q.id];
      return {
        question_id: q.id,
        selected_answer_id: Array.isArray(answer) ? answer[0] ?? '' : answer ?? '',
      };
    }).filter((a) => a.selected_answer_id !== '');

    try {
      const res = await fetch(`/api/quizzes/attempts/${currentAttemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error ?? 'Failed to submit quiz');
        setState('error');
        return;
      }

      const data: SubmissionResult = await res.json();
      setSubmissionResult(data);
      setState('completed');

      if (onComplete && data.attempt.score !== null && data.attempt.passed !== null) {
        onComplete(data.attempt.passed, data.attempt.score);
      }
    } catch {
      setErrorMessage('Failed to submit quiz. Please try again.');
      setState('error');
    }
  }

  function handleSingleAnswer(questionId: string, answerId: string) {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  }

  function handleMultipleAnswer(questionId: string, answerId: string, checked: boolean) {
    setUserAnswers((prev) => {
      const current = (prev[questionId] as string[] | undefined) ?? [];
      if (checked) {
        return { ...prev, [questionId]: [...current, answerId] };
      } else {
        return { ...prev, [questionId]: current.filter((id) => id !== answerId) };
      }
    });
  }

  function handleFreeText(questionId: string, value: string) {
    setUserAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function isQuestionAnswered(question: QuizQuestion): boolean {
    const answer = userAnswers[question.id];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return answer.trim().length > 0;
  }

  function allQuestionsAnswered(): boolean {
    if (!quiz) return false;
    return quiz.quiz_questions.every((q) => isQuestionAnswered(q));
  }

  // Render loading state
  if (state === 'loading') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center text-muted-foreground">Loading quiz...</div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (state === 'error') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">{errorMessage}</p>
          <Button variant="outline" onClick={fetchQuiz}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render cannot attempt state
  if (state === 'cannot_attempt' || !quiz) {
    const lastAttempt = attempts[0];
    return (
      <Card>
        <CardHeader>
          <CardTitle>{quiz?.title ?? 'Quiz'}</CardTitle>
          {quiz?.description && <CardDescription>{quiz.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {lastAttempt && (
            <div className="rounded-lg border p-4">
              <p className="font-medium">Your last attempt:</p>
              <p className="text-sm text-muted-foreground">
                Score: {lastAttempt.score ?? 0}% &mdash;{' '}
                <Badge variant={lastAttempt.passed ? 'default' : 'destructive'}>
                  {lastAttempt.passed ? 'Passed' : 'Failed'}
                </Badge>
              </p>
            </div>
          )}
          <p className="text-muted-foreground">
            {quiz?.allow_retakes === false
              ? 'This quiz does not allow retakes.'
              : 'You have used all available attempts for this quiz.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render start screen
  if (state === 'start') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          {quiz.description && <CardDescription>{quiz.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground">Questions</p>
              <p className="text-lg font-bold">{quiz.quiz_questions.length}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground">Passing Score</p>
              <p className="text-lg font-bold">{quiz.passing_score}%</p>
            </div>
          </div>

          {attempts.length > 0 && (
            <div className="rounded-lg border p-4 text-sm">
              <p className="font-medium mb-2">Previous Attempts</p>
              {attempts.slice(0, 3).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">
                    {new Date(attempt.started_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{attempt.score ?? 0}%</span>
                    <Badge variant={attempt.passed ? 'default' : 'destructive'} className="text-xs">
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {attemptsRemaining !== null && (
            <p className="text-sm text-muted-foreground">
              Attempts remaining: {attemptsRemaining}
            </p>
          )}

          <Button className="w-full" onClick={startAttempt}>
            {attempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render completed state
  if (state === 'completed' && submissionResult) {
    const { attempt, results } = submissionResult;
    const score = attempt.score ?? 0;
    const passed = attempt.passed ?? false;

    return (
      <div className="space-y-6">
        {/* Result Header */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              {passed ? (
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="mx-auto h-16 w-16 text-destructive" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{passed ? 'Congratulations!' : 'Not quite there'}</h2>
            <p className="text-muted-foreground mb-4">
              You scored <span className="font-bold text-foreground">{score}%</span> (passing: {quiz.passing_score}%)
            </p>
            <Badge variant={passed ? 'default' : 'destructive'} className="text-base px-4 py-1">
              {passed ? 'PASSED' : 'FAILED'}
            </Badge>
            <div className="mt-4">
              <Progress value={score} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Answer Review */}
        {quiz.show_correct_answers && results && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Answer Review</h3>
            {results.map((result) => (
              <Card key={result.id} className={result.is_correct ? 'border-green-500' : 'border-destructive'}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-medium">
                      {result.quiz_questions.question_text}
                    </CardTitle>
                    {result.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.quiz_questions.quiz_answers.map((ans) => {
                    const isSelected = ans.id === result.selected_answer_id;
                    const isCorrect = (ans as QuizAnswer & { is_correct?: boolean }).is_correct;
                    return (
                      <div
                        key={ans.id}
                        className={`rounded-md border p-2 text-sm ${
                          isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : isSelected
                            ? 'border-destructive bg-red-50 text-red-800'
                            : 'border-muted bg-muted/30'
                        }`}
                      >
                        {ans.answer_text}
                        {isSelected && !isCorrect && (
                          <span className="ml-2 text-xs">(your answer)</span>
                        )}
                        {isCorrect && (
                          <span className="ml-2 text-xs font-medium">(correct)</span>
                        )}
                      </div>
                    );
                  })}
                  {result.quiz_questions.explanation && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {result.quiz_questions.explanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Retry button */}
        {quiz.allow_retakes && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSubmissionResult(null);
              setCurrentAttemptId(null);
              fetchQuiz();
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Quiz
          </Button>
        )}
      </div>
    );
  }

  // Render quiz taking state
  if (state !== 'taking' && state !== 'submitting') return null;

  const questions = quiz.quiz_questions;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = questions.filter((q) => isQuestionAnswered(q)).length;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-base leading-relaxed">
              {currentQuestion.question_text}
            </CardTitle>
            <Badge variant="outline" className="shrink-0">
              {currentQuestion.points} {currentQuestion.points === 1 ? 'pt' : 'pts'}
            </Badge>
          </div>
          {currentQuestion.question_type === 'multiple_select' && (
            <CardDescription>Select all that apply</CardDescription>
          )}
          {currentQuestion.question_type === 'free_text' && (
            <CardDescription>Enter your answer below</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* Multiple Choice (single answer) */}
          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-2">
              {currentQuestion.quiz_answers.map((answer) => {
                const isSelected = userAnswers[currentQuestion.id] === answer.id;
                return (
                  <button
                    key={answer.id}
                    type="button"
                    onClick={() => handleSingleAnswer(currentQuestion.id, answer.id)}
                    className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {answer.answer_text}
                  </button>
                );
              })}
            </div>
          )}

          {/* Multiple Select (multiple answers) */}
          {currentQuestion.question_type === 'multiple_select' && (
            <div className="space-y-2">
              {currentQuestion.quiz_answers.map((answer) => {
                const selectedAnswers = (userAnswers[currentQuestion.id] as string[] | undefined) ?? [];
                const isSelected = selectedAnswers.includes(answer.id);
                return (
                  <label
                    key={answer.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        handleMultipleAnswer(currentQuestion.id, answer.id, e.target.checked)
                      }
                      className="h-4 w-4 rounded"
                    />
                    {answer.answer_text}
                  </label>
                );
              })}
            </div>
          )}

          {/* Free Text */}
          {currentQuestion.question_type === 'free_text' && (
            <textarea
              value={(userAnswers[currentQuestion.id] as string | undefined) ?? ''}
              onChange={(e) => handleFreeText(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here..."
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-1">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === currentQuestionIndex
                  ? 'bg-primary'
                  : isQuestionAnswered(q)
                  ? 'bg-primary/40'
                  : 'bg-muted-foreground/30'
              }`}
              aria-label={`Go to question ${idx + 1}`}
            />
          ))}
        </div>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={submitQuiz}
            disabled={!allQuestionsAnswered() || state === 'submitting'}
          >
            {state === 'submitting' ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </div>

      {/* Answer all questions notice */}
      {!allQuestionsAnswered() && (
        <p className="text-center text-xs text-muted-foreground">
          Answer all questions to submit
        </p>
      )}
    </div>
  );
}
