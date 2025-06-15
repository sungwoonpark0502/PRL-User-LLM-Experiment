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
  selectedParticipant?: string
  llmMappings: Array<{ id: string; realName: string; displayName: string }>
}

export function ExperimentResultsDialog({
  open,
  onOpenChange,
  experimentId,
  selectedParticipant,
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
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-xl">
            Results: {mockResults.experimentName}
            {selectedParticipant && ` - Participant #${selectedParticipant}`}
          </DialogTitle>
          <DialogDescription>
            {llm ? `${llm.displayName} (${llm.realName})` : "Unknown LLM"} •
            {mockResults.completedAt.toLocaleDateString()}
            {selectedParticipant && ` • Participant #${selectedParticipant}`}
          </DialogDescription>
        </DialogHeader>

        {!selectedParticipant && (
          <div className="flex-shrink-0 p-4 border rounded-md bg-muted/50 mb-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                This experiment has multiple participants. Please select a participant to view their results.
              </p>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close and Select Participant
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedParticipant && (
          <div className="flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="flex-shrink-0 grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="overview">Performance Summary</TabsTrigger>
                <TabsTrigger value="chat">Chat History</TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0">
                <TabsContent value="overview" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-6 pr-4">
                      {/* Performance Summary Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                              sectionStats.mixed.total > 0
                                ? (sectionStats.mixed.correct / sectionStats.mixed.total) * 100
                                : 0
                            }
                            className="h-2"
                          />
                        </Card>
                      </div>

                      {/* Overall Performance */}
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

                      {/* Question Results */}
                      <div>
                        <div className="text-sm font-medium mb-3">Question Results</div>
                        <div className="space-y-3">
                          {mockResults.results.map((result, index) => (
                            <Card key={result.id} className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={result.correct ? "default" : "destructive"} className="text-xs">
                                    {result.correct ? "Correct" : "Incorrect"}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {result.section}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">Q{index + 1}</div>
                              </div>

                              <div className="text-sm mb-3 font-medium">{result.question}</div>

                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Answer:</div>
                                  <div className="text-xs bg-muted p-2 rounded max-h-20 overflow-y-auto">
                                    {result.userAnswer}
                                  </div>
                                </div>

                                {!result.correct && result.correctAnswer && (
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Expected:</div>
                                    <div className="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded max-h-20 overflow-y-auto">
                                      {result.correctAnswer}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="chat" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                      {mockResults.results.map((result, index) => (
                        <Card key={result.id} className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Q{index + 1}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {result.section}
                              </Badge>
                              <Badge variant={result.correct ? "default" : "destructive"} className="text-xs">
                                {result.correct ? "Correct" : "Incorrect"}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-sm mb-4 p-3 bg-muted/50 rounded-lg font-medium">{result.question}</div>

                          {result.chatHistory && result.chatHistory.length > 0 ? (
                            <div className="space-y-3">
                              <div className="text-sm font-medium text-muted-foreground">Chat History</div>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {result.chatHistory.map((message, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                  >
                                    <div
                                      className={`max-w-[80%] p-2 rounded-lg text-xs ${
                                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                      }`}
                                    >
                                      <div className="font-medium mb-1 opacity-70">
                                        {message.role === "user" ? "Participant" : "Assistant"}
                                      </div>
                                      {message.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground py-6 text-sm">
                              No chat history for this question
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        <DialogFooter className="flex-shrink-0 flex justify-between items-center border-t pt-4 mt-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{totalStats.correct}</span> correct out of {totalStats.total} questions
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
