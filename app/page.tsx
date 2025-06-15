"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, BookOpen, PenLine, Calculator, Send, Menu, User, Shuffle } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsDialog } from "@/components/settings-dialog"
import { useRouter } from "next/navigation"

type MessageRole = "user" | "assistant"

interface Message {
  role: MessageRole
  content: string
}

// Define types for mixed questions
type QuestionType = "reading" | "writing" | "math"

interface MixedQuestion {
  id: string
  type: QuestionType
  content: string
  difficulty: "elementary" | "middle" | "high"
}

// Define types for section questions
interface ReadingQuestion {
  id: string
  passage: string
  multipleChoice: {
    question: string
    options: string[]
    correctAnswer: number
  }
  openEnded: {
    question: string
  }
}

interface WritingPrompt {
  id: string
  prompt: string
  wordCountMin: number
  wordCountMax: number
}

interface MathChallenge {
  id: string
  problem: string
  example: string
  defaultAnswer: string
}

export default function Home() {
  const [selectedParticipant, setSelectedParticipant] = useState<string>("")

  // Mock experiments data - in a real app, this would come from the researcher's created experiments
  const [experiments, setExperiments] = useState([
    {
      id: "exp1",
      name: "Reading Comprehension Study",
      participants: [{ participantNumber: "1", llmId: "1", llmDisplayName: "Sarah", assignedQuestions: ["1", "2"] }],
    },
    {
      id: "exp2",
      name: "Math Skills Assessment",
      participants: [{ participantNumber: "2", llmId: "5", llmDisplayName: "Michael", assignedQuestions: ["5", "7"] }],
    },
    {
      id: "exp3",
      name: "Writing Analysis",
      participants: [{ participantNumber: "3", llmId: "3", llmDisplayName: "James", assignedQuestions: ["2", "4"] }],
    },
  ])

  // Get all available participants from all experiments - simplified to just participant numbers
  const allParticipants = experiments.map((exp) => ({
    ...exp.participants[0], // Since each experiment has only one participant now
    experimentName: exp.name,
    experimentId: exp.id,
  }))

  // Get available LLMs for the selected participant
  const selectedParticipantData = allParticipants.find((p) => p.participantNumber === selectedParticipant)

  const [inputValue, setInputValue] = useState("")
  const [selectedLLM, setSelectedLLM] = useState("gpt-4")
  const [userAnswer, setUserAnswer] = useState("")
  const [userEssay, setUserEssay] = useState("")
  const [userMathAnswer, setUserMathAnswer] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false)
  const [isSubmittingEssay, setIsSubmittingEssay] = useState(false)
  const [isSubmittingMath, setIsSubmittingMath] = useState(false)
  const [activeTab, setActiveTab] = useState("reading")
  const { toast } = useToast()
  const isMobile = useMobile()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Current question indices for each section
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0)
  const [currentWritingIndex, setCurrentWritingIndex] = useState(0)
  const [currentMathIndex, setCurrentMathIndex] = useState(0)

  // Mixed section state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [isSubmittingMixed, setIsSubmittingMixed] = useState(false)

  // Chat history for each question in each section
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({})

  // Get current chat key based on active tab and question index
  const getCurrentChatKey = () => {
    switch (activeTab) {
      case "reading":
        return `reading-${currentReadingIndex}`
      case "writing":
        return `writing-${currentWritingIndex}`
      case "math":
        return `math-${currentMathIndex}`
      case "mixed":
        return `mixed-${currentQuestionIndex}`
      default:
        return "general"
    }
  }

  // Get current messages for the active question
  const currentChatKey = getCurrentChatKey()
  const currentMessages = chatHistories[currentChatKey] || []

  // Sample reading questions
  const [readingQuestions, setReadingQuestions] = useState<ReadingQuestion[]>([
    {
      id: "r1",
      passage:
        "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals.",
      multipleChoice: {
        question: "What is the primary definition of AI according to the passage?",
        options: [
          "Intelligence demonstrated by machines",
          "Human-like cognitive abilities",
          "The study of computer algorithms",
          "A branch of mathematics",
        ],
        correctAnswer: 0,
      },
      openEnded: {
        question: "How has the definition of AI evolved over time according to the passage?",
      },
    },
    {
      id: "r2",
      passage:
        "Machine learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.",
      multipleChoice: {
        question: "What is the main focus of machine learning?",
        options: [
          "Creating human-like robots",
          "Developing programs that learn from data",
          "Building faster computers",
          "Designing better algorithms",
        ],
        correctAnswer: 1,
      },
      openEnded: {
        question: "Explain how machine learning differs from traditional programming.",
      },
    },
    {
      id: "r3",
      passage:
        "Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning. Learning can be supervised, semi-supervised or unsupervised. Deep learning architectures such as deep neural networks have been applied to fields including computer vision, speech recognition, and natural language processing.",
      multipleChoice: {
        question: "What is deep learning based on?",
        options: ["Statistical models", "Decision trees", "Artificial neural networks", "Logical reasoning"],
        correctAnswer: 2,
      },
      openEnded: {
        question: "List three fields where deep learning has been applied according to the passage.",
      },
    },
    {
      id: "r4",
      passage:
        "Natural Language Processing (NLP) is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language, in particular how to program computers to process and analyze large amounts of natural language data.",
      multipleChoice: {
        question: "What is Natural Language Processing primarily concerned with?",
        options: [
          "Creating new human languages",
          "Interactions between computers and human language",
          "Teaching computers to speak",
          "Translating between programming languages",
        ],
        correctAnswer: 1,
      },
      openEnded: {
        question: "Why is NLP considered an interdisciplinary field based on the passage?",
      },
    },
    {
      id: "r5",
      passage:
        "Computer vision is an interdisciplinary scientific field that deals with how computers can gain high-level understanding from digital images or videos. From the perspective of engineering, it seeks to understand and automate tasks that the human visual system can do.",
      multipleChoice: {
        question: "What does computer vision aim to do?",
        options: [
          "Improve human vision",
          "Create better cameras",
          "Automate tasks that the human visual system can do",
          "Develop new image formats",
        ],
        correctAnswer: 2,
      },
      openEnded: {
        question: "How might computer vision be applied in real-world scenarios?",
      },
    },
  ])

  // Sample writing prompts
  const [writingPrompts, setWritingPrompts] = useState<WritingPrompt[]>([
    {
      id: "w1",
      prompt:
        "Discuss the ethical implications of artificial intelligence in modern society. Consider aspects such as privacy, job displacement, and decision-making.",
      wordCountMin: 300,
      wordCountMax: 500,
    },
    {
      id: "w2",
      prompt:
        "Compare and contrast the potential benefits and drawbacks of implementing universal basic income in response to increasing automation.",
      wordCountMin: 250,
      wordCountMax: 450,
    },
    {
      id: "w3",
      prompt: "Analyze the impact of social media on interpersonal relationships and mental health in the digital age.",
      wordCountMin: 300,
      wordCountMax: 500,
    },
    {
      id: "w4",
      prompt:
        "Discuss the challenges and opportunities of remote work and its long-term effects on workplace culture and productivity.",
      wordCountMin: 250,
      wordCountMax: 450,
    },
    {
      id: "w5",
      prompt:
        "Evaluate the role of technology in education and how it has transformed learning experiences for students of different ages.",
      wordCountMin: 300,
      wordCountMax: 500,
    },
  ])

  // Sample math challenges
  const [mathChallenges, setMathChallenges] = useState<MathChallenge[]>([
    {
      id: "m1",
      problem: "Solve for x in the equation: 2x + 5 = 15. Show your work step by step.",
      example: "Example: If 3x + 2 = 11, then 3x = 9, so x = 3",
      defaultAnswer: "Show your work here...\n\n",
    },
    {
      id: "m2",
      problem: "Find the area of a circle with radius 7 units. Use π ≈ 3.14159.",
      example: "Formula: A = πr²\nExample: For radius 3, A = π × 3² = 9π ≈ 28.27 square units",
      defaultAnswer: "Show your calculation here...\n\n",
    },
    {
      id: "m3",
      problem: "Solve the quadratic equation: x² - 5x + 6 = 0. Find both solutions.",
      example: "You can use factoring, completing the square, or the quadratic formula",
      defaultAnswer: "Show your solution method here...\n\n",
    },
    {
      id: "m4",
      problem: "Calculate the slope of the line passing through points (2, 3) and (6, 11).",
      example: "Formula: slope = (y₂ - y₁) / (x₂ - x₁)",
      defaultAnswer: "Show your calculation here...\n\n",
    },
    {
      id: "m5",
      problem: "Find the value of log₂(32). Explain your reasoning.",
      example: "Think about what power of 2 gives you 32",
      defaultAnswer: "Show your reasoning here...\n\n",
    },
  ])

  // Sample mixed questions
  const [mixedQuestions, setMixedQuestions] = useState<MixedQuestion[]>([
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
      content: "Solve for x: 3x + 7 = 22",
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
      content: "Find the area of a triangle with base 8 units and height 6 units.",
      difficulty: "middle",
    },
  ])

  // Auto-scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentMessages])

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setIsSendingMessage(true)

      // Simulate API call delay
      setTimeout(() => {
        const newMessages: Message[] = [
          ...currentMessages,
          { role: "user" as MessageRole, content: inputValue },
          {
            role: "assistant" as MessageRole,
            content: `This is a simulated response from ${selectedLLM}. In a real implementation, this would be connected to the actual LLM API.`,
          },
        ]

        // Update chat history for current question
        setChatHistories((prev) => ({
          ...prev,
          [currentChatKey]: newMessages,
        }))

        setInputValue("")
        setIsSendingMessage(false)
      }, 500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSubmitAnswers = () => {
    setIsSubmittingAnswers(true)
    setTimeout(() => {
      toast({
        title: "Answers submitted",
        description: "Your answers have been submitted successfully.",
      })
      setIsSubmittingAnswers(false)

      // Move to next question if available
      if (currentReadingIndex < readingQuestions.length - 1) {
        setCurrentReadingIndex(currentReadingIndex + 1)
        setUserAnswer("")
      }
    }, 800)
  }

  const handleSubmitEssay = () => {
    setIsSubmittingEssay(true)
    setTimeout(() => {
      toast({
        title: "Essay submitted",
        description: "Your essay has been submitted successfully.",
      })
      setIsSubmittingEssay(false)

      // Move to next prompt if available
      if (currentWritingIndex < writingPrompts.length - 1) {
        setCurrentWritingIndex(currentWritingIndex + 1)
        setUserEssay("")
      }
    }, 800)
  }

  const handleSubmitMath = () => {
    setIsSubmittingMath(true)
    setTimeout(() => {
      toast({
        title: "Math solution submitted",
        description: "Your solution has been submitted successfully.",
      })
      setIsSubmittingMath(false)

      // Move to next problem if available
      if (currentMathIndex < mathChallenges.length - 1) {
        setCurrentMathIndex(currentMathIndex + 1)
        setUserMathAnswer(mathChallenges[currentMathIndex + 1].defaultAnswer)
      }
    }, 800)
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Mixed section handlers
  const handleMixedAnswerChange = (value: string) => {
    const currentQuestion = mixedQuestions[currentQuestionIndex]
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: value,
    })
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mixedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmitAllMixed = () => {
    setIsSubmittingMixed(true)
    setTimeout(() => {
      toast({
        title: "All Answers Submitted",
        description: "All your answers have been submitted successfully.",
      })
      setIsSubmittingMixed(false)
    }, 1000)
  }

  // Get current mixed question
  const currentQuestion = mixedQuestions[currentQuestionIndex]
  const currentMixedAnswer = userAnswers[currentQuestion?.id] || ""

  // Get current section questions
  const currentReadingQuestion = readingQuestions[currentReadingIndex]
  const currentWritingPrompt = writingPrompts[currentWritingIndex]
  const currentMathChallenge = mathChallenges[currentMathIndex]

  // Navigation for section questions
  const handleNextReadingQuestion = () => {
    if (currentReadingIndex < readingQuestions.length - 1) {
      setCurrentReadingIndex(currentReadingIndex + 1)
      setUserAnswer("")
    }
  }

  const handlePrevReadingQuestion = () => {
    if (currentReadingIndex > 0) {
      setCurrentReadingIndex(currentReadingIndex - 1)
    }
  }

  const handleNextWritingPrompt = () => {
    if (currentWritingIndex < writingPrompts.length - 1) {
      setCurrentWritingIndex(currentWritingIndex + 1)
      setUserEssay("")
    }
  }

  const handlePrevWritingPrompt = () => {
    if (currentWritingIndex > 0) {
      setCurrentWritingIndex(currentWritingIndex - 1)
    }
  }

  const handleNextMathChallenge = () => {
    if (currentMathIndex < mathChallenges.length - 1) {
      setCurrentMathIndex(currentMathIndex + 1)
      setUserMathAnswer(mathChallenges[currentMathIndex + 1].defaultAnswer)
    }
  }

  const handlePrevMathChallenge = () => {
    if (currentMathIndex > 0) {
      setCurrentMathIndex(currentMathIndex - 1)
      setUserMathAnswer(mathChallenges[currentMathIndex - 1].defaultAnswer)
    }
  }

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

  // Get difficulty display label
  const getDifficultyLabel = (difficulty: "elementary" | "middle" | "high") => {
    switch (difficulty) {
      case "elementary":
        return "Elementary (K-5)"
      case "middle":
        return "Middle School (6-8)"
      case "high":
        return "High School (9-12)"
      default:
        return difficulty
    }
  }

  // Auto-select LLM when participant is selected
  useEffect(() => {
    if (selectedParticipantData) {
      setSelectedLLM(selectedParticipantData.llmDisplayName)
    }
  }, [selectedParticipantData])

  return (
    <main className="flex flex-col bg-gray-50 dark:bg-gray-900 h-screen overflow-hidden">
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center shadow-sm">
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold dark:text-white">LLM Experiment</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">People and Robots Lab - Experimental Tool</p>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => (window.location.href = "/researcher")}
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Researcher Access</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Researcher Access</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SettingsDialog />
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ThemeToggle />
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 ml-1">
                  <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[350px]">
                <div className="space-y-4 py-4">
                  <div className="px-3 py-2">
                    <h2 className="mb-2 text-lg font-semibold dark:text-white">Select Participant</h2>
                    <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose your participant number" />
                      </SelectTrigger>
                      <SelectContent>
                        {allParticipants.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No participants available
                          </SelectItem>
                        ) : (
                          allParticipants.map((participant) => (
                            <SelectItem key={participant.participantNumber} value={participant.participantNumber}>
                              Participant {participant.participantNumber}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="px-3 py-2">
                    <h2 className="mb-2 text-lg font-semibold dark:text-white">Select LLM Model</h2>
                    <Select value={selectedLLM} onValueChange={setSelectedLLM} disabled={!selectedParticipant}>
                      <SelectTrigger id="mobile-llm-select" className="w-full">
                        <SelectValue
                          placeholder={selectedParticipant ? "LLM will be assigned" : "Select participant first"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedParticipantData ? (
                          <SelectItem value={selectedParticipantData.llmDisplayName}>
                            {selectedParticipantData.llmDisplayName}
                          </SelectItem>
                        ) : (
                          <SelectItem value="none" disabled>
                            Select participant first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="px-3">
                    <h2 className="mb-2 text-lg font-semibold dark:text-white">Task Modes</h2>
                    <div className="space-y-1">
                      <Button
                        variant={activeTab === "reading" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange("reading")}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Reading
                      </Button>
                      <Button
                        variant={activeTab === "writing" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange("writing")}
                      >
                        <PenLine className="h-4 w-4 mr-2" />
                        Writing
                      </Button>
                      <Button
                        variant={activeTab === "math" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange("math")}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Math
                      </Button>
                      <Button
                        variant={activeTab === "mixed" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange("mixed")}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Mixed
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>

      <div className="flex flex-col md:flex-row h-[calc(100vh-56px-16px)] md:h-[calc(100vh-56px)]">
        {/* Left Section (1/2) - Chat Interface */}
        <div className="w-full md:w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden">
          {!isMobile && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="mb-3">
                <Label htmlFor="participant-select" className="text-sm font-medium dark:text-gray-300">
                  Select Participant
                </Label>
                <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                  <SelectTrigger id="participant-select" className="w-full mt-1">
                    <SelectValue placeholder="Choose your participant number" />
                  </SelectTrigger>
                  <SelectContent>
                    {allParticipants.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No participants available
                      </SelectItem>
                    ) : (
                      allParticipants.map((participant) => (
                        <SelectItem key={participant.participantNumber} value={participant.participantNumber}>
                          Participant {participant.participantNumber}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-1">
                <Label htmlFor="llm-select" className="text-sm font-medium dark:text-gray-300">
                  Select LLM Model
                </Label>
                <Select value={selectedLLM} onValueChange={setSelectedLLM} disabled={!selectedParticipant}>
                  <SelectTrigger id="llm-select" className="w-full mt-1">
                    <SelectValue
                      placeholder={selectedParticipant ? "LLM will be assigned" : "Select participant first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedParticipantData ? (
                      <SelectItem value={selectedParticipantData.llmDisplayName}>
                        {selectedParticipantData.llmDisplayName}
                      </SelectItem>
                    ) : (
                      <SelectItem value="none" disabled>
                        Select participant first
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedParticipantData && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Participant {selectedParticipantData.participantNumber} • {selectedParticipantData.experimentName} •{" "}
                    {selectedParticipantData.assignedQuestions.length} questions
                  </p>
                </div>
              )}
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {currentMessages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 my-6">
                  <MessageSquare className="mx-auto h-10 w-10 opacity-50 mb-2" />
                  <p>No messages yet. Start a conversation!</p>
                  <p className="text-sm mt-2 max-w-xs mx-auto">
                    Ask questions about the tasks or request assistance with the reading, writing, or math exercises.
                  </p>
                </div>
              ) : (
                currentMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-100 dark:bg-blue-900/30 ml-4 md:ml-6"
                        : "bg-gray-100 dark:bg-gray-700 mr-4 md:mr-6"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1 dark:text-gray-200">
                      {message.role === "user" ? "You" : "Assistant"}
                    </p>
                    <p className="text-sm md:text-base dark:text-gray-300">{message.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-3 md:p-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Ask a question..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="resize-none text-sm md:text-base pr-2 min-h-[40px] h-10 py-2 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400"
                    style={{ overflow: "auto" }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !inputValue.trim()}
                  size="default"
                  className="h-10"
                >
                  {isSendingMessage ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {!isMobile && <span className="ml-2">Send</span>}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section (1/2) - Task Modes */}
        <div className="w-full md:w-1/2 h-full flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
          <Tabs
            defaultValue="reading"
            value={activeTab}
            onValueChange={handleTabChange}
            className="h-full flex flex-col"
          >
            {!isMobile && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <TabsList className="w-full justify-start p-0 bg-transparent">
                  <TabsTrigger
                    value="reading"
                    className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-6 py-3"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Reading
                  </TabsTrigger>
                  <TabsTrigger
                    value="writing"
                    className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-6 py-3"
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    Writing
                  </TabsTrigger>
                  <TabsTrigger
                    value="math"
                    className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-6 py-3"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Math
                  </TabsTrigger>
                  <TabsTrigger
                    value="mixed"
                    className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-6 py-3"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Mixed
                  </TabsTrigger>
                </TabsList>
              </div>
            )}

            <ScrollArea className="flex-1">
              <TabsContent value="reading" className="p-3 md:p-5 m-0">
                <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg md:text-xl dark:text-white">Reading Comprehension</CardTitle>
                        <CardDescription className="dark:text-gray-400">
                          Question {currentReadingIndex + 1} of {readingQuestions.length}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevReadingQuestion}
                          disabled={currentReadingIndex === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextReadingQuestion}
                          disabled={currentReadingIndex === readingQuestions.length - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 md:space-y-5">
                      <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="font-medium mb-2 text-sm md:text-base dark:text-gray-200">Passage</h3>
                        <p className="text-xs md:text-sm leading-relaxed dark:text-gray-300">
                          {currentReadingQuestion.passage}
                        </p>
                      </div>

                      <div className="space-y-3 md:space-y-4">
                        <h3 className="font-medium text-sm md:text-base dark:text-gray-200">
                          Multiple Choice Question
                        </h3>
                        <p className="text-xs md:text-sm mb-2 md:mb-3 dark:text-gray-300">
                          {currentReadingQuestion.multipleChoice.question}
                        </p>

                        <RadioGroup defaultValue="option1">
                          {currentReadingQuestion.multipleChoice.options.map((option, index) => (
                            <div key={index} className="flex items-start space-x-2 mb-2">
                              <RadioGroupItem value={`option${index + 1}`} id={`option${index + 1}`} />
                              <Label
                                htmlFor={`option${index + 1}`}
                                className="text-xs md:text-sm font-normal dark:text-gray-300"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="space-y-3 md:space-y-4">
                        <h3 className="font-medium text-sm md:text-base dark:text-gray-200">Open-Ended Question</h3>
                        <p className="text-xs md:text-sm mb-2 md:mb-3 dark:text-gray-300">
                          {currentReadingQuestion.openEnded.question}
                        </p>
                        <Textarea
                          placeholder="Type your answer here..."
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          rows={isMobile ? 3 : 4}
                          className="text-xs md:text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400"
                        />
                      </div>

                      {currentReadingIndex === readingQuestions.length - 1 && (
                        <Button className="w-full" onClick={handleSubmitAnswers} disabled={isSubmittingAnswers}>
                          {isSubmittingAnswers ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : null}
                          Submit All Reading Answers
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="writing" className="p-3 md:p-5 m-0">
                <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg md:text-xl dark:text-white">Writing Task</CardTitle>
                        <CardDescription className="dark:text-gray-400">
                          Prompt {currentWritingIndex + 1} of {writingPrompts.length}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevWritingPrompt}
                          disabled={currentWritingIndex === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextWritingPrompt}
                          disabled={currentWritingIndex === writingPrompts.length - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 md:space-y-5">
                      <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="font-medium mb-2 text-sm md:text-base dark:text-gray-200">Writing Prompt</h3>
                        <p className="text-xs md:text-sm leading-relaxed dark:text-gray-300">
                          {currentWritingPrompt.prompt}
                        </p>
                      </div>

                      <div>
                        <Textarea
                          placeholder="Write your essay here..."
                          value={userEssay}
                          onChange={(e) => setUserEssay(e.target.value)}
                          className="min-h-[200px] md:min-h-[280px] text-xs md:text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400"
                        />
                        <div className="flex justify-between mt-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          <span>{userEssay.split(/\s+/).filter(Boolean).length} words</span>
                          <span>
                            Recommended: {currentWritingPrompt.wordCountMin}-{currentWritingPrompt.wordCountMax} words
                          </span>
                        </div>
                      </div>

                      {currentWritingIndex === writingPrompts.length - 1 && (
                        <Button className="w-full" onClick={handleSubmitEssay} disabled={isSubmittingEssay}>
                          {isSubmittingEssay ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : null}
                          Submit All Essays
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="math" className="p-3 md:p-5 m-0">
                <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg md:text-xl dark:text-white">Math Problem</CardTitle>
                        <CardDescription className="dark:text-gray-400">
                          Problem {currentMathIndex + 1} of {mathChallenges.length}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevMathChallenge}
                          disabled={currentMathIndex === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextMathChallenge}
                          disabled={currentMathIndex === mathChallenges.length - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 md:space-y-5">
                      <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="font-medium mb-2 text-sm md:text-base dark:text-gray-200">Problem Statement</h3>
                        <p className="text-xs md:text-sm leading-relaxed dark:text-gray-300">
                          {currentMathChallenge.problem}
                        </p>
                        <div className="mt-3">
                          <p className="text-xs md:text-sm font-medium dark:text-gray-200">Example:</p>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-600 p-2 rounded mt-1 overflow-x-auto dark:text-gray-300">
                            {currentMathChallenge.example}
                          </pre>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-medium text-sm md:text-base dark:text-gray-200">Your Solution</h3>
                        <Textarea
                          placeholder="Show your work here..."
                          value={userMathAnswer}
                          onChange={(e) => setUserMathAnswer(e.target.value)}
                          className="min-h-[200px] md:min-h-[280px] text-xs md:text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400 font-mono"
                        />
                      </div>

                      {currentMathIndex === mathChallenges.length - 1 ? (
                        <Button className="w-full" onClick={handleSubmitMath} disabled={isSubmittingMath}>
                          {isSubmittingMath ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : null}
                          Submit All Math Solutions
                        </Button>
                      ) : (
                        <div className="flex space-x-3">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => setUserMathAnswer(currentMathChallenge.defaultAnswer)}
                          >
                            Reset
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mixed Section Tab */}
              <TabsContent value="mixed" className="p-3 md:p-5 m-0">
                <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg md:text-xl dark:text-white">Mixed Questions</CardTitle>
                        <CardDescription className="dark:text-gray-400">
                          Question {currentQuestionIndex + 1} of {mixedQuestions.length}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousQuestion}
                          disabled={currentQuestionIndex === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextQuestion}
                          disabled={currentQuestionIndex === mixedQuestions.length - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                          {getQuestionIcon(currentQuestion.type)}
                        </div>
                        <div className="ml-2">
                          <h3 className="text-sm font-medium dark:text-gray-200">
                            {getQuestionTypeLabel(currentQuestion.type)}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getDifficultyLabel(currentQuestion.difficulty)}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="font-medium mb-2 text-sm md:text-base dark:text-gray-200">Question</h3>
                        <p className="text-sm md:text-base leading-relaxed dark:text-gray-300">
                          {currentQuestion.content}
                        </p>
                      </div>

                      {currentQuestion.type === "reading" && (
                        <div className="space-y-3">
                          <h3 className="font-medium text-sm md:text-base dark:text-gray-200">Your Answer</h3>
                          <Textarea
                            placeholder="Type your answer here..."
                            value={currentMixedAnswer}
                            onChange={(e) => handleMixedAnswerChange(e.target.value)}
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
                            value={currentMixedAnswer}
                            onChange={(e) => handleMixedAnswerChange(e.target.value)}
                            rows={10}
                            className="text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400"
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{currentMixedAnswer.split(/\s+/).filter(Boolean).length} words</span>
                            <span>Recommended: 200-400 words</span>
                          </div>
                        </div>
                      )}

                      {currentQuestion.type === "math" && (
                        <div className="space-y-3">
                          <h3 className="font-medium text-sm md:text-base dark:text-gray-200">Your Solution</h3>
                          <Textarea
                            placeholder="Show your work here..."
                            value={currentMixedAnswer}
                            onChange={(e) => handleMixedAnswerChange(e.target.value)}
                            rows={8}
                            className="text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400 font-mono"
                          />
                        </div>
                      )}

                      {currentQuestionIndex === mixedQuestions.length - 1 && (
                        <Button className="w-full" onClick={handleSubmitAllMixed} disabled={isSubmittingMixed}>
                          {isSubmittingMixed ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : null}
                          Submit All Mixed Answers
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around p-2 z-10">
          <Button
            variant={activeTab === "chat" ? "default" : "ghost"}
            size="sm"
            className="flex-1 mx-1"
            onClick={() => handleTabChange("chat")}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Chat
          </Button>
          <Button
            variant={activeTab === "reading" ? "default" : "ghost"}
            size="sm"
            className="flex-1 mx-1"
            onClick={() => handleTabChange("reading")}
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Reading
          </Button>
          <Button
            variant={activeTab === "writing" ? "default" : "ghost"}
            size="sm"
            className="flex-1 mx-1"
            onClick={() => handleTabChange("writing")}
          >
            <PenLine className="h-4 w-4 mr-1" />
            Writing
          </Button>
          <Button
            variant={activeTab === "math" ? "default" : "ghost"}
            size="sm"
            className="flex-1 mx-1"
            onClick={() => handleTabChange("math")}
          >
            <Calculator className="h-4 w-4 mr-1" />
            Math
          </Button>
          <Button
            variant={activeTab === "mixed" ? "default" : "ghost"}
            size="sm"
            className="flex-1 mx-1"
            onClick={() => handleTabChange("mixed")}
          >
            <Shuffle className="h-4 w-4 mr-1" />
            Mixed
          </Button>
        </div>
      )}

      {/* Add a small margin at the bottom */}
      <div className="h-4 bg-gray-50 dark:bg-gray-900"></div>
    </main>
  )
}
