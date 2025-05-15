"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen,
  PenLine,
  Code,
  Upload,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Search,
  Edit,
  Check,
  X,
  FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { ResearcherLoginDialog } from "@/components/researcher-login-dialog"
import { Separator } from "@/components/ui/separator"
import { ExperimentResultsDialog } from "@/components/experiment-results-dialog"

// Define types for our question pools
type Difficulty = "easy" | "medium" | "hard"
type Section = "reading" | "writing" | "coding" | "mixed"

// First, let's update our Question type to include associated files
interface Question {
  id: string
  content: string
  difficulty: Difficulty
  section: Section
  files?: string[] // Add files array to store associated file names
}

interface LLMMapping {
  id: string
  realName: string
  displayName: string
}

// Define a type for created experiments
interface Experiment {
  id: string
  name: string
  llmId: string
  questionCounts: {
    reading: number
    writing: number
    coding: number
    mixed: number
  }
  createdAt: Date
}

// Available LLM models
const availableLLMs = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "llama-3-70b", label: "Llama 3 (70B)" },
  { value: "mistral-large", label: "Mistral Large" },
  { value: "gemini-pro", label: "Gemini Pro" },
]

export default function ResearcherPage() {
  const [activeTab, setActiveTab] = useState<string>("questions")
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState<string>("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium")
  const [selectedSection, setSelectedSection] = useState<Section>("reading")
  const [llmMappings, setLlmMappings] = useState<LLMMapping[]>([
    { id: "1", realName: "gpt-4", displayName: "Sarah" },
    { id: "2", realName: "gpt-3.5-turbo", displayName: "Peter" },
    { id: "3", realName: "claude-3-opus", displayName: "James" },
    { id: "4", realName: "llama-3-70b", displayName: "Emily" },
    { id: "5", realName: "mistral-large", displayName: "Michael" },
  ])
  const [selectedLLM, setSelectedLLM] = useState<string>("gpt-4")
  const [newLLMDisplayName, setNewLLMDisplayName] = useState<string>("")
  const [selectedExperimentLLM, setSelectedExperimentLLM] = useState<string>("")
  const [experimentName, setExperimentName] = useState<string>("")

  // State for created experiments
  const [experiments, setExperiments] = useState<Experiment[]>([])

  // State for editing experiments
  const [editingExperimentId, setEditingExperimentId] = useState<string | null>(null)
  const [editingQuestionCounts, setEditingQuestionCounts] = useState<Record<string, number>>({})
  const [editingLLMId, setEditingLLMId] = useState<string>("")

  // State for viewing experiment results
  const [viewingExperimentId, setViewingExperimentId] = useState<string | null>(null)
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false)

  // Filter states
  const [filterSection, setFilterSection] = useState<string>("all-sections")
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all-difficulties")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Question counts with number inputs
  const [questionCounts, setQuestionCounts] = useState({
    reading: 5,
    writing: 5,
    coding: 5,
    mixed: 5,
  })

  const [uploadedMaterials, setUploadedMaterials] = useState<string[]>([])
  // Add a state to track pending uploads (files that haven't been associated with a question yet)
  const [pendingUploads, setPendingUploads] = useState<string[]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(true)

  // Load sample questions on mount
  useEffect(() => {
    // In a real app, you would fetch this from a database
    const sampleQuestions: Question[] = [
      {
        id: "1",
        content: "Read the passage and identify the main theme.",
        difficulty: "easy",
        section: "reading",
      },
      {
        id: "2",
        content: "Analyze the given text and explain how machine learning differs from traditional programming.",
        difficulty: "medium",
        section: "reading",
      },
      {
        id: "3",
        content: "Write an essay about the impact of technology on society.",
        difficulty: "medium",
        section: "writing",
      },
      {
        id: "4",
        content: "Write a short essay discussing the ethical implications of AI in healthcare.",
        difficulty: "hard",
        section: "writing",
      },
      {
        id: "5",
        content: "Implement a function to find the factorial of a number.",
        difficulty: "easy",
        section: "coding",
      },
      {
        id: "6",
        content: "Create a function that implements the merge sort algorithm.",
        difficulty: "hard",
        section: "coding",
      },
      {
        id: "7",
        content: "Read the passage and write code to solve the described problem.",
        difficulty: "medium",
        section: "mixed",
      },
    ]
    setQuestions(sampleQuestions)

    // Add some sample experiments
    const sampleExperiments: Experiment[] = [
      {
        id: "exp1",
        name: "Reading Comprehension Study",
        llmId: "1", // Sarah (GPT-4)
        questionCounts: {
          reading: 8,
          writing: 2,
          coding: 0,
          mixed: 0,
        },
        createdAt: new Date(2023, 10, 15),
      },
      {
        id: "exp2",
        name: "Coding Skills Assessment",
        llmId: "5", // Michael (Mistral)
        questionCounts: {
          reading: 0,
          writing: 0,
          coding: 10,
          mixed: 5,
        },
        createdAt: new Date(2023, 11, 2),
      },
    ]
    setExperiments(sampleExperiments)
  }, [])

  // Filter questions based on selected filters and search query
  const filteredQuestions = questions.filter((question) => {
    // Filter by section
    if (filterSection !== "all-sections" && question.section !== filterSection) {
      return false
    }

    // Filter by difficulty
    if (filterDifficulty !== "all-difficulties" && question.difficulty !== filterDifficulty) {
      return false
    }

    // Filter by search query
    if (searchQuery.trim() !== "" && !question.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })

  // Handle login
  const handleLogin = (password: string) => {
    // Simple password check - in a real app, this would be more secure
    if (password === "12345") {
      setIsAuthenticated(true)
      setShowLoginDialog(false)
      return true
    }
    return false
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !showLoginDialog) {
      router.push("/")
    }
  }, [isAuthenticated, showLoginDialog, router])

  // Update the handleFileUpload function to store files in pendingUploads instead of uploadedMaterials
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // In a real app, you would upload these files to a server
      // Here we'll just store the file names
      const newMaterials = Array.from(files).map((file) => file.name)
      setPendingUploads([...pendingUploads, ...newMaterials])
      toast({
        title: "Files Uploaded",
        description: `${files.length} file(s) have been uploaded.`,
      })

      // Reset the file input
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  // Update the handleAddQuestion function to associate pending uploads with the question
  const handleAddQuestion = () => {
    if (newQuestion.trim() || pendingUploads.length > 0) {
      const newQuestionObj: Question = {
        id: Date.now().toString(),
        content: newQuestion.trim(),
        difficulty: selectedDifficulty,
        section: selectedSection,
        files: pendingUploads.length > 0 ? [...pendingUploads] : undefined,
      }
      setQuestions([...questions, newQuestionObj])

      // Add the files to uploadedMaterials for tracking all uploads
      setUploadedMaterials([...uploadedMaterials, ...pendingUploads])

      // Reset form
      setNewQuestion("")
      setPendingUploads([])

      toast({
        title: newQuestion.trim() ? "Question Added" : "Files Added",
        description: newQuestion.trim()
          ? `The question has been added to the pool${pendingUploads.length > 0 ? " with associated files" : ""}.`
          : "The files have been added to the pool.",
      })
    }
  }

  // Add a function to remove a file from pending uploads
  const handleRemovePendingUpload = (fileName: string) => {
    setPendingUploads(pendingUploads.filter((name) => name !== fileName))
  }

  // Update the handleDeleteQuestion function to also remove associated files from uploadedMaterials
  const handleDeleteQuestion = (id: string) => {
    const questionToDelete = questions.find((q) => q.id === id)
    setQuestions(questions.filter((q) => q.id !== id))

    // If the question had files, remove them from uploadedMaterials
    if (questionToDelete?.files && questionToDelete.files.length > 0) {
      setUploadedMaterials(uploadedMaterials.filter((material) => !questionToDelete.files?.includes(material)))
    }

    toast({
      title: "Question Deleted",
      description: "The question has been removed from the pool.",
    })
  }

  const handleAddLLMMapping = () => {
    if (selectedLLM && newLLMDisplayName.trim()) {
      const newMapping: LLMMapping = {
        id: Date.now().toString(),
        realName: selectedLLM,
        displayName: newLLMDisplayName,
      }
      setLlmMappings([...llmMappings, newMapping])
      setNewLLMDisplayName("")
      toast({
        title: "Mapping Added",
        description: "The new LLM mapping has been added.",
      })
    }
  }

  const handleDeleteLLMMapping = (id: string) => {
    setLlmMappings(llmMappings.filter((m) => m.id !== id))
    toast({
      title: "Mapping Deleted",
      description: "The LLM mapping has been removed.",
    })
  }

  const handleDeleteMaterial = (name: string) => {
    setUploadedMaterials(uploadedMaterials.filter((m) => m !== name))
    toast({
      title: "File Deleted",
      description: "The file has been removed.",
    })
  }

  const handleSaveConfiguration = () => {
    // In a real app, you would save this configuration to a database
    toast({
      title: "Saved",
      description: "Your experiment configuration has been saved.",
    })
  }

  const handleGenerateExperiment = () => {
    if (!experimentName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an experiment name.",
        variant: "destructive",
      })
      return
    }

    if (!selectedExperimentLLM && llmMappings.length > 0) {
      toast({
        title: "Error",
        description: "Please select an LLM for the experiment.",
        variant: "destructive",
      })
      return
    }

    // Create a new experiment
    const newExperiment: Experiment = {
      id: `exp-${Date.now()}`,
      name: experimentName,
      llmId: selectedExperimentLLM,
      questionCounts: { ...questionCounts },
      createdAt: new Date(),
    }

    // Add to experiments list
    setExperiments([...experiments, newExperiment])

    // Find the selected LLM mapping
    const selectedLLM = llmMappings.find((mapping) => mapping.id === selectedExperimentLLM)

    // Reset form
    setExperimentName("")

    // Show success message
    toast({
      title: "Experiment Created",
      description: selectedLLM
        ? `Your experiment "${experimentName}" has been created with ${selectedLLM.displayName} (${selectedLLM.realName}).`
        : `Your experiment "${experimentName}" has been created.`,
    })
  }

  // Handle question count change
  const handleQuestionCountChange = (section: keyof typeof questionCounts, value: string) => {
    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
      setQuestionCounts({
        ...questionCounts,
        [section]: numValue,
      })
    }
  }

  // Handle editing experiment question count
  const handleEditQuestionCountChange = (section: string, value: string) => {
    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
      setEditingQuestionCounts({
        ...editingQuestionCounts,
        [section]: numValue,
      })
    }
  }

  // Start editing an experiment
  const handleStartEditExperiment = (experiment: Experiment) => {
    setEditingExperimentId(experiment.id)
    setEditingQuestionCounts(experiment.questionCounts)
    setEditingLLMId(experiment.llmId)
  }

  // Save edited experiment
  const handleSaveEditExperiment = (id: string) => {
    setExperiments(
      experiments.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              llmId: editingLLMId,
              questionCounts: {
                reading: editingQuestionCounts.reading || 0,
                writing: editingQuestionCounts.writing || 0,
                coding: editingQuestionCounts.coding || 0,
                mixed: editingQuestionCounts.mixed || 0,
              },
            }
          : exp,
      ),
    )

    setEditingExperimentId(null)

    toast({
      title: "Experiment Updated",
      description: "The experiment has been updated successfully.",
    })
  }

  // Cancel editing
  const handleCancelEditExperiment = () => {
    setEditingExperimentId(null)
  }

  // Delete experiment
  const handleDeleteExperiment = (id: string) => {
    setExperiments(experiments.filter((exp) => exp.id !== id))

    toast({
      title: "Experiment Deleted",
      description: "The experiment has been deleted.",
    })
  }

  // View experiment results
  const handleViewResults = (id: string) => {
    setViewingExperimentId(id)
    setShowResultsDialog(true)
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilterSection("all-sections")
    setFilterDifficulty("all-difficulties")
    setSearchQuery("")
  }

  // If not authenticated, show login dialog
  if (!isAuthenticated) {
    return <ResearcherLoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={handleLogin} />
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold dark:text-white">Researcher Dashboard</h1>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="questions" className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Questions</span>
              <span className="inline md:hidden">Questions</span>
            </TabsTrigger>
            <TabsTrigger value="llm" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              <span>LLMs</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center">
              <PenLine className="h-4 w-4 mr-2" />
              <span>Setup</span>
            </TabsTrigger>
          </TabsList>

          {/* Question Pools Tab */}
          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Questions</CardTitle>
                <CardDescription>Add and manage questions for each section.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Add New Question and Upload Files - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Add New Question */}
                    <div className="space-y-2">
                      <Label htmlFor="new-question">Add New Question</Label>
                      <Textarea
                        id="new-question"
                        placeholder="Enter a new question..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="section">Section</Label>
                          <Select
                            value={selectedSection}
                            onValueChange={(value) => setSelectedSection(value as Section)}
                          >
                            <SelectTrigger id="section">
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="reading">Reading</SelectItem>
                              <SelectItem value="writing">Writing</SelectItem>
                              <SelectItem value="coding">Coding</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="difficulty">Difficulty</Label>
                          <Select
                            value={selectedDifficulty}
                            onValueChange={(value) => setSelectedDifficulty(value as Difficulty)}
                          >
                            <SelectTrigger id="difficulty">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleAddQuestion} disabled={!newQuestion.trim()} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {/* Upload Files */}
                    <div className="space-y-2">
                      <Label htmlFor="upload-materials">Upload Files</Label>
                      <div className="border-2 border-dashed rounded-md p-4 text-center dark:border-gray-700 min-h-[100px] flex flex-col justify-center">
                        <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Drag and drop files here, or click to browse
                        </p>
                        <Input
                          id="upload-materials"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("upload-materials")?.click()}
                        >
                          Browse
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Supported: PDF, DOCX, TXT, JPG, PNG (Max 10MB)
                      </div>

                      {/* Display pending uploads */}
                      {pendingUploads.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Pending Files</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleAddQuestion()}
                            >
                              Add Files Only
                            </Button>
                          </div>
                          <div className="border rounded-md h-[100px] overflow-auto mt-1">
                            <ScrollArea className="h-full p-2">
                              <div className="space-y-1">
                                {pendingUploads.map((material, index) => (
                                  <div
                                    key={index}
                                    className="p-2 border rounded-md flex items-center justify-between dark:border-gray-700 text-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <Upload className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                      <span className="truncate">{material}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemovePendingUpload(material)}
                                      className="h-6 w-6 flex-shrink-0"
                                    >
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Filter Questions - Below Add and Upload */}
                  <div className="space-y-2 border rounded-md p-4 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Filter Questions</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {filteredQuestions.length} of {questions.length} Questions
                        </Badge>
                        {uploadedMaterials.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {uploadedMaterials.length} Files
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-7 px-2">
                          Reset
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Select value={filterSection} onValueChange={setFilterSection}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Sections" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-sections">All Sections</SelectItem>
                          <SelectItem value="reading">Reading</SelectItem>
                          <SelectItem value="writing">Writing</SelectItem>
                          <SelectItem value="coding">Coding</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Difficulties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-difficulties">All Difficulties</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="col-span-2 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <Input
                          placeholder="Search questions..."
                          className="w-full pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    {uploadedMaterials.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-xs text-gray-500 dark:text-gray-400">Recently Uploaded</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {uploadedMaterials.slice(0, 5).map((material, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                          {uploadedMaterials.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{uploadedMaterials.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Question List */}
                  <div className="border rounded-md">
                    <ScrollArea className="h-[400px] p-4">
                      <div className="space-y-4">
                        {filteredQuestions.length === 0 ? (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <p>No questions match your filters.</p>
                            <Button variant="link" onClick={handleResetFilters} className="mt-2">
                              Reset Filters
                            </Button>
                          </div>
                        ) : (
                          filteredQuestions.map((question) => (
                            <div
                              key={question.id}
                              className="p-3 border rounded-md flex items-start justify-between gap-2 dark:border-gray-700"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={
                                      question.difficulty === "easy"
                                        ? "outline"
                                        : question.difficulty === "medium"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {question.difficulty}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {question.section}
                                  </Badge>
                                </div>
                                {question.content && (
                                  <p className="text-sm dark:text-gray-300 mb-2">{question.content}</p>
                                )}
                                {question.files && question.files.length > 0 && (
                                  <div className="mt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Associated Files:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {question.files.map((file, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {file}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="h-8 w-8 flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LLM Mapping Tab */}
          <TabsContent value="llm" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>LLM Mapping</CardTitle>
                <CardDescription>Map LLM models to display names for participants.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Add New Mapping</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="real-llm-name" className="text-xs">
                          LLM Model
                        </Label>
                        <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                          <SelectTrigger id="real-llm-name">
                            <SelectValue placeholder="Select LLM" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLLMs.map((llm) => (
                              <SelectItem key={llm.value} value={llm.value}>
                                {llm.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="display-name" className="text-xs">
                          Display Name
                        </Label>
                        <Input
                          id="display-name"
                          placeholder="e.g., Sarah"
                          value={newLLMDisplayName}
                          onChange={(e) => setNewLLMDisplayName(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddLLMMapping}
                      disabled={!selectedLLM || !newLLMDisplayName.trim()}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md">
                  <ScrollArea className="h-[300px] p-4">
                    <div className="space-y-2">
                      {llmMappings.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                          No LLM mappings added yet. Add your first mapping above.
                        </p>
                      ) : (
                        llmMappings.map((mapping) => (
                          <div
                            key={mapping.id}
                            className="p-3 border rounded-md flex items-center justify-between dark:border-gray-700"
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-sm font-medium dark:text-gray-200">LLM:</p>
                                <p className="text-sm dark:text-gray-300">{mapping.realName}</p>
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">→</div>
                              <div>
                                <p className="text-sm font-medium dark:text-gray-200">Name:</p>
                                <p className="text-sm dark:text-gray-300">{mapping.displayName}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLLMMapping(mapping.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab - With Number Inputs */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Experiment Setup</CardTitle>
                <CardDescription>Configure the experiment settings and create your experiment.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="experiment-name" className="text-sm">
                          Experiment Name
                        </Label>
                        <Input
                          id="experiment-name"
                          placeholder="Enter experiment name"
                          value={experimentName}
                          onChange={(e) => setExperimentName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experiment-llm" className="text-sm">
                          LLM Selection
                        </Label>
                        <Select value={selectedExperimentLLM} onValueChange={setSelectedExperimentLLM}>
                          <SelectTrigger id="experiment-llm">
                            <SelectValue placeholder="Select LLM for experiment" />
                          </SelectTrigger>
                          <SelectContent>
                            {llmMappings.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No LLMs available - add in LLMs tab
                              </SelectItem>
                            ) : (
                              llmMappings.map((mapping) => (
                                <SelectItem key={mapping.id} value={mapping.id}>
                                  {mapping.displayName} ({mapping.realName})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-3">Question Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Reading Section */}
                      <div className="space-y-2 border rounded-md p-3 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="reading-questions" className="text-sm font-medium">
                            Reading
                          </Label>
                          <Switch id="reading-enabled" defaultChecked />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="reading-questions" className="text-xs whitespace-nowrap">
                            Questions:
                          </Label>
                          <Input
                            id="reading-questions"
                            type="number"
                            min="0"
                            max="20"
                            value={questionCounts.reading}
                            onChange={(e) => handleQuestionCountChange("reading", e.target.value)}
                            className="h-8 w-16"
                          />
                        </div>
                      </div>

                      {/* Writing Section */}
                      <div className="space-y-2 border rounded-md p-3 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="writing-questions" className="text-sm font-medium">
                            Writing
                          </Label>
                          <Switch id="writing-enabled" defaultChecked />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="writing-questions" className="text-xs whitespace-nowrap">
                            Questions:
                          </Label>
                          <Input
                            id="writing-questions"
                            type="number"
                            min="0"
                            max="20"
                            value={questionCounts.writing}
                            onChange={(e) => handleQuestionCountChange("writing", e.target.value)}
                            className="h-8 w-16"
                          />
                        </div>
                      </div>

                      {/* Coding Section */}
                      <div className="space-y-2 border rounded-md p-3 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="coding-questions" className="text-sm font-medium">
                            Coding
                          </Label>
                          <Switch id="coding-enabled" defaultChecked />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="coding-questions" className="text-xs whitespace-nowrap">
                            Questions:
                          </Label>
                          <Input
                            id="coding-questions"
                            type="number"
                            min="0"
                            max="20"
                            value={questionCounts.coding}
                            onChange={(e) => handleQuestionCountChange("coding", e.target.value)}
                            className="h-8 w-16"
                          />
                        </div>
                      </div>

                      {/* Mixed Section */}
                      <div className="space-y-2 border rounded-md p-3 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="mixed-questions" className="text-sm font-medium">
                            Mixed
                          </Label>
                          <Switch id="mixed-enabled" defaultChecked />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="mixed-questions" className="text-xs whitespace-nowrap">
                            Questions:
                          </Label>
                          <Input
                            id="mixed-questions"
                            type="number"
                            min="0"
                            max="20"
                            value={questionCounts.mixed}
                            onChange={(e) => handleQuestionCountChange("mixed", e.target.value)}
                            className="h-8 w-16"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" size="default" onClick={handleSaveConfiguration}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button
                      size="default"
                      onClick={handleGenerateExperiment}
                      className="px-8"
                      disabled={!experimentName.trim() || (!selectedExperimentLLM && llmMappings.length > 0)}
                    >
                      Create Experiment
                    </Button>
                  </div>

                  {/* Experiments List */}
                  {experiments.length > 0 && (
                    <>
                      <Separator className="my-6" />

                      <div>
                        <h3 className="text-sm font-medium mb-3">Created Experiments</h3>
                        <div className="space-y-4">
                          {experiments.map((experiment) => (
                            <div key={experiment.id} className="border rounded-md p-4 dark:border-gray-700">
                              {editingExperimentId === experiment.id ? (
                                // Editing mode
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-medium">{experiment.name}</h4>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSaveEditExperiment(experiment.id)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Check className="h-4 w-4 text-green-500" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEditExperiment}
                                        className="h-8 w-8 p-0"
                                      >
                                        <X className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <Label htmlFor={`edit-llm-${experiment.id}`} className="text-sm">
                                        LLM Selection
                                      </Label>
                                      <Select value={editingLLMId} onValueChange={setEditingLLMId}>
                                        <SelectTrigger id={`edit-llm-${experiment.id}`}>
                                          <SelectValue placeholder="Select LLM for experiment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {llmMappings.map((mapping) => (
                                            <SelectItem key={mapping.id} value={mapping.id}>
                                              {mapping.displayName} ({mapping.realName})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <div className="space-y-1">
                                        <Label htmlFor={`edit-reading-${experiment.id}`} className="text-xs">
                                          Reading Questions
                                        </Label>
                                        <Input
                                          id={`edit-reading-${experiment.id}`}
                                          type="number"
                                          min="0"
                                          max="20"
                                          value={editingQuestionCounts.reading}
                                          onChange={(e) => handleEditQuestionCountChange("reading", e.target.value)}
                                          className="h-8"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor={`edit-writing-${experiment.id}`} className="text-xs">
                                          Writing Questions
                                        </Label>
                                        <Input
                                          id={`edit-writing-${experiment.id}`}
                                          type="number"
                                          min="0"
                                          max="20"
                                          value={editingQuestionCounts.writing}
                                          onChange={(e) => handleEditQuestionCountChange("writing", e.target.value)}
                                          className="h-8"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor={`edit-coding-${experiment.id}`} className="text-xs">
                                          Coding Questions
                                        </Label>
                                        <Input
                                          id={`edit-coding-${experiment.id}`}
                                          type="number"
                                          min="0"
                                          max="20"
                                          value={editingQuestionCounts.coding}
                                          onChange={(e) => handleEditQuestionCountChange("coding", e.target.value)}
                                          className="h-8"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor={`edit-mixed-${experiment.id}`} className="text-xs">
                                          Mixed Questions
                                        </Label>
                                        <Input
                                          id={`edit-mixed-${experiment.id}`}
                                          type="number"
                                          min="0"
                                          max="20"
                                          value={editingQuestionCounts.mixed}
                                          onChange={(e) => handleEditQuestionCountChange("mixed", e.target.value)}
                                          className="h-8"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // View mode
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-medium">{experiment.name}</h4>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStartEditExperiment(experiment)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className="h-4 w-4 text-blue-500" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteExperiment(experiment.id)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {/* LLM Badge */}
                                    {(() => {
                                      const llm = llmMappings.find((m) => m.id === experiment.llmId)
                                      return llm ? (
                                        <Badge variant="secondary" className="text-xs">
                                          LLM: {llm.displayName} ({llm.realName})
                                        </Badge>
                                      ) : null
                                    })()}

                                    {/* Question count badges */}
                                    {experiment.questionCounts.reading > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        Reading: {experiment.questionCounts.reading}
                                      </Badge>
                                    )}
                                    {experiment.questionCounts.writing > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        Writing: {experiment.questionCounts.writing}
                                      </Badge>
                                    )}
                                    {experiment.questionCounts.coding > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        Coding: {experiment.questionCounts.coding}
                                      </Badge>
                                    )}
                                    {experiment.questionCounts.mixed > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        Mixed: {experiment.questionCounts.mixed}
                                      </Badge>
                                    )}

                                    {/* Date badge */}
                                    <Badge variant="outline" className="text-xs">
                                      Created: {experiment.createdAt.toLocaleDateString()}
                                    </Badge>
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewResults(experiment.id)}
                                      className="flex items-center gap-1"
                                    >
                                      <FileText className="h-4 w-4" />
                                      View Results
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Results Dialog */}
      <ExperimentResultsDialog
        open={showResultsDialog}
        onOpenChange={setShowResultsDialog}
        experimentId={viewingExperimentId}
        llmMappings={llmMappings}
      />
    </main>
  )
}
