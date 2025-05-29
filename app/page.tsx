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
import { MessageSquare, BookOpen, PenLine, Code, Send, Menu, User, Shuffle } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsDialog } from "@/components/settings-dialog"
import CodeEditor from "@/components/code-editor"
import { useRouter } from "next/navigation"
import { getLLMResponse } from "@/lib/openai"

type MessageRole = "user" | "assistant"

interface Message {
  role: MessageRole
  content: string
}

// Define types for mixed questions
type QuestionType = "reading" | "writing" | "coding"

interface MixedQuestion {
  id: string
  type: QuestionType
  content: string
  difficulty: "easy" | "medium" | "hard"
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

interface CodingChallenge {
  id: string
  problem: string
  example: string
  defaultCode: string
}

// Add LLM mapping constant
const LLM_MAPPINGS = {
  "gpt-4": "Sarah",
  "gpt-3.5-turbo": "Peter",
  "claude-3-opus": "James",
  "llama-3-70b": "Emily",
  "mistral-large": "Michael",
  "gemini-pro": "Emily"
} as const

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [selectedLLM, setSelectedLLM] = useState("Sarah") // Changed default to display name
  const [selectedLanguage, setSelectedLanguage] = useState("javascript")
  const [userAnswer, setUserAnswer] = useState("")
  const [userEssay, setUserEssay] = useState("")
  const [userCode, setUserCode] = useState("// Write your code here\n\n")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false)
  const [isSubmittingEssay, setIsSubmittingEssay] = useState(false)
  const [isRunningCode, setIsRunningCode] = useState(false)
  const [activeTab, setActiveTab] = useState("reading")
  const { toast } = useToast()
  const isMobile = useMobile()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Current question indices for each section
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0)
  const [currentWritingIndex, setCurrentWritingIndex] = useState(0)
  const [currentCodingIndex, setCurrentCodingIndex] = useState(0)

  // Mixed section state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [isSubmittingMixed, setIsSubmittingMixed] = useState(false)

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

  // Sample coding challenges
  const [codingChallenges, setCodingChallenges] = useState<CodingChallenge[]>([
    {
      id: "c1",
      problem:
        "Write a function that takes an array of integers and returns the two numbers that add up to a specific target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
      example: "Input: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1] (because nums[0] + nums[1] = 2 + 7 = 9)",
      defaultCode: "// Write your code here\n\n",
    },
    {
      id: "c2",
      problem:
        "Implement a function to check if a string is a palindrome (reads the same backward as forward), considering only alphanumeric characters and ignoring case.",
      example: "Input: 'A man, a plan, a canal: Panama'\nOutput: true",
      defaultCode: "// Write your code here\n\n",
    },
    {
      id: "c3",
      problem:
        "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
      example: "Input: ['flower', 'flow', 'flight']\nOutput: 'fl'",
      defaultCode: "// Write your code here\n\n",
    },
    {
      id: "c4",
      problem: "Implement a function that merges two sorted arrays into a single sorted array.",
      example: "Input: [1, 3, 5], [2, 4, 6]\nOutput: [1, 2, 3, 4, 5, 6]",
      defaultCode: "// Write your code here\n\n",
    },
    {
      id: "c5",
      problem: "Write a function that converts a given integer to its Roman numeral representation.",
      example: "Input: 58\nOutput: 'LVIII' (L = 50, V = 5, III = 3)",
      defaultCode: "// Write your code here\n\n",
    },
  ])

  // Sample mixed questions
  const [mixedQuestions, setMixedQuestions] = useState<MixedQuestion[]>([
    {
      id: "1",
      type: "reading",
      content: "Read the passage and identify the main theme of artificial intelligence development.",
      difficulty: "medium",
    },
    {
      id: "2",
      type: "writing",
      content: "Write a short essay about the ethical implications of AI in healthcare.",
      difficulty: "hard",
    },
    {
      id: "3",
      type: "coding",
      content: "Write a function that finds the maximum value in an array of integers.",
      difficulty: "easy",
    },
    {
      id: "4",
      type: "reading",
      content: "Analyze the given text and explain how machine learning differs from traditional programming.",
      difficulty: "medium",
    },
    {
      id: "5",
      type: "coding",
      content: "Implement a function that checks if a string is a palindrome.",
      difficulty: "medium",
    },
  ])

  // Auto-scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSendingMessage) return

    setIsSendingMessage(true)
    const userMessage = inputValue.trim()
    setInputValue("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    try {
      // Use the display name from the mapping
      const displayName = LLM_MAPPINGS[selectedLLM as keyof typeof LLM_MAPPINGS] || selectedLLM
      const llmReply = await getLLMResponse(userMessage, displayName)
      setMessages((prev) => [...prev, { role: "assistant", content: llmReply }])
    } catch (error) {
      console.error("Error getting LLM response:", error)
      toast({
        title: "Error",
        description: "Failed to get response from LLM. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage(false)
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

  const handleRunCode = () => {
    setIsRunningCode(true)
    setTimeout(() => {
      toast({
        title: "Code executed",
        description: "Your code has been executed. Check the output panel for results.",
      })
      setIsRunningCode(false)
    }, 1000)
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
  const currentCodingChallenge = codingChallenges[currentCodingIndex]

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

  const handleNextCodingChallenge = () => {
    if (currentCodingIndex < codingChallenges.length - 1) {
      setCurrentCodingIndex(currentCodingIndex + 1)
      setUserCode(codingChallenges[currentCodingIndex + 1].defaultCode)
    }
  }

  const handlePrevCodingChallenge = () => {
    if (currentCodingIndex > 0) {
      setCurrentCodingIndex(currentCodingIndex - 1)
      setUserCode(codingChallenges[currentCodingIndex - 1].defaultCode)
    }
  }

  // Get question icon based on type
  const getQuestionIcon = (type: QuestionType) => {
    switch (type) {
      case "reading":
        return <BookOpen className="h-5 w-5" />
      case "writing":
        return <PenLine className="h-5 w-5" />
      case "coding":
        return <Code className="h-5 w-5" />
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
      case "coding":
        return "Coding Challenge"
      default:
        return "Question"
    }
  }

  return (
    <main className="flex flex-col bg-gray-50 dark:bg-gray-900 h-screen overflow-hidden">
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center shadow-sm">
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold dark:text-white">LLM Experiment</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">People and Robots Lab</p>
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
                    <h2 className="mb-2 text-lg font-semibold dark:text-white">Select LLM Model</h2>
                    <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                      <SelectTrigger id="mobile-llm-select" className="w-full">
                        <SelectValue placeholder="Select LLM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sarah">GPT-4 (Sarah)</SelectItem>
                        <SelectItem value="Peter">GPT-3.5 Turbo (Peter)</SelectItem>
                        <SelectItem value="James">Claude 3 Opus (James)</SelectItem>
                        <SelectItem value="Emily">Gemini Pro (Emily)</SelectItem>
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
                        variant={activeTab === "coding" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange("coding")}
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Coding
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
              <div className="mb-1">
                <Label htmlFor="llm-select" className="text-sm font-medium dark:text-gray-300">
                  Select LLM Model
                </Label>
                <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select LLM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sarah">GPT-4 (Sarah)</SelectItem>
                    <SelectItem value="Peter">GPT-3.5 Turbo (Peter)</SelectItem>
                    <SelectItem value="James">Claude 3 Opus (James)</SelectItem>
                    <SelectItem value="Emily">Gemini Pro (Emily)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 my-6">
                  <MessageSquare className="mx-auto h-10 w-10 opacity-50 mb-2" />
                  <p>No messages yet.</p>
                  <p className="text-sm mt-2 max-w-xs mx-auto">
                    For reference only
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
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
                    value="coding"
                    className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-6 py-3"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Coding
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

                      <Button className="w-full" onClick={handleSubmitAnswers} disabled={isSubmittingAnswers}>
                        {isSubmittingAnswers ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : null}
                        Submit Answers
                      </Button>
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

                      <Button className="w-full" onClick={handleSubmitEssay} disabled={isSubmittingEssay}>
                        {isSubmittingEssay ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : null}
                        Submit Essay
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coding" className="p-3 md:p-5 m-0">
                <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg md:text-xl dark:text-white">Coding Challenge</CardTitle>
                        <CardDescription className="dark:text-gray-400">
                          Challenge {currentCodingIndex + 1} of {codingChallenges.length}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevCodingChallenge}
                          disabled={currentCodingIndex === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextCodingChallenge}
                          disabled={currentCodingIndex === codingChallenges.length - 1}
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
                          {currentCodingChallenge.problem}
                        </p>
                        <div className="mt-3">
                          <p className="text-xs md:text-sm font-medium dark:text-gray-200">Example:</p>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-600 p-2 rounded mt-1 overflow-x-auto dark:text-gray-300">
                            {currentCodingChallenge.example}
                          </pre>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-sm md:text-base dark:text-gray-200">Your Solution</h3>
                          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger className="w-[140px] md:w-[180px] text-xs md:text-sm">
                              <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="javascript">JavaScript</SelectItem>
                              <SelectItem value="python">Python</SelectItem>
                              <SelectItem value="java">Java</SelectItem>
                              <SelectItem value="cpp">C++</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <CodeEditor
                          language={selectedLanguage}
                          value={userCode}
                          onChange={setUserCode}
                          height={isMobile ? 180 : 280}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <Button className="flex-1" onClick={handleRunCode} disabled={isRunningCode}>
                          {isRunningCode ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : null}
                          Run Code
                        </Button>
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() => setUserCode(currentCodingChallenge.defaultCode)}
                        >
                          Reset
                        </Button>
                      </div>

                      <div className="p-3 border rounded-lg dark:border-gray-600 dark:bg-gray-700">
                        <h3 className="text-xs md:text-sm font-medium mb-2 dark:text-gray-200">Output</h3>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-600 p-2 rounded overflow-x-auto dark:text-gray-300">
                          // Output will appear here after running your code
                        </pre>
                      </div>
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

                      {currentQuestion.type === "coding" && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-sm md:text-base dark:text-gray-200">Your Solution</h3>
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                              <SelectTrigger className="w-[140px] md:w-[180px] text-xs md:text-sm">
                                <SelectValue placeholder="Select Language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="javascript">JavaScript</SelectItem>
                                <SelectItem value="python">Python</SelectItem>
                                <SelectItem value="java">Java</SelectItem>
                                <SelectItem value="cpp">C++</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <CodeEditor
                            language={selectedLanguage}
                            value={currentMixedAnswer}
                            onChange={handleMixedAnswerChange}
                            height={250}
                          />
                        </div>
                      )}

                      <Button className="w-full" onClick={handleSubmitAllMixed} disabled={isSubmittingMixed}>
                        {isSubmittingMixed ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : null}
                        Submit
                      </Button>
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
            variant={activeTab === "coding" ? "default" : "ghost"}
            size="sm"
            className="flex-1 mx-1"
            onClick={() => handleTabChange("coding")}
          >
            <Code className="h-4 w-4 mr-1" />
            Coding
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
