"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, PenLine, ArrowLeft, ArrowRight, Calculator } from "lucide-react"
import { useRouter } from "next/navigation"

// Define types for our mixed questions
type QuestionType = "reading" | "writing" | "math"

interface MixedQuestion {
  id: string
  type: QuestionType
  content: string
  difficulty: "elementary" | "middle" | "high"
}

export default function MixedPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [selectedLanguage, setSelectedLanguage] = useState("javascript")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Sample mixed questions
  const [questions, setQuestions] = useState<MixedQuestion[]>([
    {
      id: "1",
      type: "reading",
      content: "Read the passage and identify the main theme of artificial intelligence development.",
      difficulty: "middle",
    },
    {
      id: "2",
      type: "writing",
      content: "Write a short essay about the ethical implications of AI in healthcare.",
      difficulty: "high",
    },
    {
      id: "3",
      type: "math",
      content: "Solve the equation: 2x + 5 = 15",
      difficulty: "elementary",
    },
    {
      id: "4",
      type: "reading",
      content: "Analyze the given text and explain how machine learning differs from traditional programming.",
      difficulty: "middle",
    },
    {
      id: "5",
      type: "math",
      content: "Calculate the area of a circle with radius 7.",
      difficulty: "middle",
    },
  ])

  // Handle answer changes
  const handleAnswerChange = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: value,
    })
  }

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  // Submit all answers
  const handleSubmitAll = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      toast({
        title: "Answers Submitted",
        description: "All your answers have been submitted successfully.",
      })
      setIsSubmitting(false)
      router.push("/")
    }, 1000)
  }

  // Get current question
  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = userAnswers[currentQuestion?.id] || ""

  // Get question icon based on type
  const getQuestionIcon = (type: QuestionType) => {
    switch (type) {
      case "reading":
        return <BookOpen className="h-5 w-5" />
      case "writing":
        return <PenLine className="h-5 w-5" />
      case "math":
        return <Calculator className="h-5 w-5" />
      default:
        return null
    }
  }

  // Get question type label
  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "reading":
        return "Reading Question"
      case "writing":
        return "Writing Task"
      case "math":
        return "Math Problem"
      default:
        return "Question"
    }
  }

  const getDifficultyLabel = (difficulty: MixedQuestion["difficulty"]) => {
    switch (difficulty) {
      case "elementary":
        return "Elementary"
      case "middle":
        return "Middle School"
      case "high":
        return "High School"
      default:
        return "Unknown"
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold dark:text-white">Mixed Questions</h1>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center gap-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">{getQuestionIcon(currentQuestion.type)}</div>
            <div>
              <CardTitle className="text-lg">{getQuestionTypeLabel(currentQuestion.type)}</CardTitle>
              <CardDescription>
                Difficulty: <span className="capitalize">{getDifficultyLabel(currentQuestion.difficulty)}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium mb-2 text-sm md:text-base dark:text-gray-200">Question</h3>
                <p className="text-sm md:text-base leading-relaxed dark:text-gray-300">{currentQuestion.content}</p>
              </div>

              {currentQuestion.type === "reading" && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm md:text-base dark:text-gray-200">Your Answer</h3>
                  <Textarea
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    rows={6}
                    className="text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400"
                  />
                </div>
              )}

              {currentQuestion.type === "writing" && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm md:text-base dark:text-gray-200">Your Essay</h3>
                  <Textarea
                    placeholder="Write your essay here..."
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    rows={10}
                    className="text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{currentAnswer.split(/\s+/).filter(Boolean).length} words</span>
                    <span>Recommended: 200-400 words</span>
                  </div>
                </div>
              )}

              {currentQuestion.type === "math" && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm md:text-base dark:text-gray-200">Your Solution</h3>
                  <Textarea
                    placeholder="Enter your solution here..."
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    rows={6}
                    className="text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleSubmitAll} disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Submit All
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8">
          <ScrollArea className="h-12 w-full">
            <div className="flex space-x-2">
              {questions.map((q, index) => (
                <Button
                  key={q.id}
                  variant={index === currentQuestionIndex ? "default" : userAnswers[q.id] ? "outline" : "ghost"}
                  size="sm"
                  className="min-w-[40px] h-10"
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </main>
  )
}
