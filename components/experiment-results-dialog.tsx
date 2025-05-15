"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Download } from "lucide-react"

// Define types for our results
interface QuestionResult {
  id: string
  section: "reading" | "writing" | "coding" | "mixed"
  question: string
  correct: boolean
  userAnswer: string
  correctAnswer?: string
  chatHistory?: {
    role: "user" | "assistant"
    content: string
    timestamp: Date
  }[]
}

interface ExperimentResults {
  experimentId: string
  experimentName: string
  llmId: string
  llmName: string
  llmModel: string
  completedAt: Date
  results: QuestionResult[]
}

interface ExperimentResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experimentId: string | null
  llmMappings: Array<{ id: string; realName: string; displayName: string }>
}

export function ExperimentResultsDialog({
  open,
  onOpenChange,
  experimentId,
  llmMappings,
}: ExperimentResultsDialogProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock results data - in a real app, this would be fetched from a database
  const mockResults: ExperimentResults = {
    experimentId: experimentId || "",
    experimentName: "Reading Comprehension Study",
    llmId: "1",
    llmName: "Sarah",
    llmModel: "gpt-4",
    completedAt: new Date(),
    results: [
      {
        id: "q1",
        section: "reading",
        question: "What is the main theme of the passage?",
        correct: true,
        userAnswer: "The impact of artificial intelligence on society",
        correctAnswer: "The impact of artificial intelligence on society",
        chatHistory: [
          {
            role: "user",
            content: "I'm not sure about the main theme. Can you help me understand the passage better?",
            timestamp: new Date(2023, 10, 15, 14, 30),
          },
          {
            role: "assistant",
            content:
              "The passage discusses how AI is transforming various aspects of society, including work, healthcare, and education.",
            timestamp: new Date(2023, 10, 15, 14, 31),
          },
        ],
      },
      {
        id: "q2",
        section: "reading",
        question: "What does the author suggest about the future of work?",
        correct: false,
        userAnswer: "All jobs will be replaced by AI",
        correctAnswer: "Some jobs will be transformed while others will be created",
        chatHistory: [
          {
            role: "user",
            content: "Does the author think all jobs will be replaced by AI?",
            timestamp: new Date(2023, 10, 15, 14, 40),
          },
        ],
      },
      {
        id: "q3",
        section: "writing",
        question: "Write a short essay about the ethical implications of AI in healthcare.",
        correct: true,
        userAnswer: "AI in healthcare presents numerous ethical considerations...",
        chatHistory: [],
      },
      {
        id: "q4",
        section: "coding",
        question: "Write a function that finds the maximum value in an array of integers.",
        correct: true,
        userAnswer: "function findMax(arr) {\n  return Math.max(...arr);\n}",
        chatHistory: [],
      },
      {
        id: "q5",
        section: "mixed",
        question: "Read the passage and implement a function that solves the described problem.",
        correct: false,
        userAnswer: "function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}",
        correctAnswer:
          "function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);\n}",
        chatHistory: [],
      },
    ],
  }

  // Calculate section statistics
  const sectionStats = {
    reading: {
      total: mockResults.results.filter((r) => r.section === "reading").length,
      correct: mockResults.results.filter((r) => r.section === "reading" && r.correct).length,
    },
    writing: {
      total: mockResults.results.filter((r) => r.section === "writing").length,
      correct: mockResults.results.filter((r) => r.section === "writing" && r.correct).length,
    },
    coding: {
      total: mockResults.results.filter((r) => r.section === "coding").length,
      correct: mockResults.results.filter((r) => r.section === "coding" && r.correct).length,
    },
    mixed: {
      total: mockResults.results.filter((r) => r.section === "mixed").length,
      correct: mockResults.results.filter((r) => r.section === "mixed" && r.correct).length,
    },
  }

  const totalStats = {
    total: mockResults.results.length,
    correct: mockResults.results.filter((r) => r.correct).length,
  }

  // Handle PDF download
  const handleDownloadPDF = () => {
    // In a real app, this would generate and download a PDF
    alert("PDF download functionality would be implemented here")
  }

  // Get LLM details
  const llm = llmMappings.find((m) => m.id === mockResults.llmId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Results: {mockResults.experimentName}</DialogTitle>
          <DialogDescription>
            {llm ? `${llm.displayName} (${llm.realName})` : "Unknown LLM"} •
            {mockResults.completedAt.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="overview">Summary</TabsTrigger>
            <TabsTrigger value="chat">Chat History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-hidden flex flex-col p-1">
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-sm font-medium mb-2">Reading</div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Correct</span>
                      <span className="font-medium">
                        {sectionStats.reading.correct} / {sectionStats.reading.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        sectionStats.reading.total > 0
                          ? (sectionStats.reading.correct / sectionStats.reading.total) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </Card>

                  <Card className="p-4">
                    <div className="text-sm font-medium mb-2">Writing</div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Correct</span>
                      <span className="font-medium">
                        {sectionStats.writing.correct} / {sectionStats.writing.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        sectionStats.writing.total > 0
                          ? (sectionStats.writing.correct / sectionStats.writing.total) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </Card>

                  <Card className="p-4">
                    <div className="text-sm font-medium mb-2">Coding</div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Correct</span>
                      <span className="font-medium">
                        {sectionStats.coding.correct} / {sectionStats.coding.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        sectionStats.coding.total > 0
                          ? (sectionStats.coding.correct / sectionStats.coding.total) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </Card>

                  <Card className="p-4">
                    <div className="text-sm font-medium mb-2">Mixed</div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Correct</span>
                      <span className="font-medium">
                        {sectionStats.mixed.correct} / {sectionStats.mixed.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        sectionStats.mixed.total > 0 ? (sectionStats.mixed.correct / sectionStats.mixed.total) * 100 : 0
                      }
                      className="h-2"
                    />
                  </Card>
                </div>

                <Card className="p-4">
                  <div className="text-sm font-medium mb-2">Overall Performance</div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total Correct</span>
                    <span className="font-medium">
                      {totalStats.correct} / {totalStats.total} (
                      {Math.round((totalStats.correct / totalStats.total) * 100)}%)
                    </span>
                  </div>
                  <Progress
                    value={totalStats.total > 0 ? (totalStats.correct / totalStats.total) * 100 : 0}
                    className="h-2"
                  />
                </Card>

                <div className="text-sm font-medium mb-2">Question Results</div>
                {mockResults.results.map((result, index) => (
                  <Card key={result.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={result.correct ? "default" : "destructive"} className="text-xs">
                          {result.correct ? "Correct" : "Incorrect"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {result.section}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Question {index + 1}</div>
                    </div>
                    <div className="text-sm mb-2">{result.question}</div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col p-1">
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-2">
                {mockResults.results
                  .filter((result) => result.chatHistory && result.chatHistory.length > 0)
                  .map((result, index) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {result.section}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">Question {index + 1}</div>
                      </div>
                      <div className="text-sm mb-3">{result.question}</div>

                      <div className="space-y-2 border-t pt-2">
                        {result.chatHistory?.map((message, idx) => (
                          <div
                            key={idx}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] p-2 rounded-lg text-sm ${
                                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              {message.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}

                {mockResults.results.filter((r) => r.chatHistory && r.chatHistory.length > 0).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No chat history available for this experiment.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center border-t pt-2">
          <div className="text-sm">
            <span className="font-medium">{totalStats.correct}</span> correct out of {totalStats.total}
          </div>
          <Button onClick={handleDownloadPDF} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
