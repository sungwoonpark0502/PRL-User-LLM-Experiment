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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen,
  PenLine,
  Calculator,
  Upload,
  Plus,
  Trash2,
  ArrowLeft,
  Search,
  Edit,
  Check,
  X,
  FileText,
  Save,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { ResearcherLoginDialog } from "@/components/researcher-login-dialog"
import { Separator } from "@/components/ui/separator"
import { ExperimentResultsDialog } from "@/components/experiment-results-dialog"
import { FileSpreadsheet } from "lucide-react"
import { FileUploadParser } from "@/components/file-upload-parser"
import { ImageIcon } from "lucide-react"

// Define types for our question pools
type Difficulty = "elementary" | "middle" | "high"
type Section = "reading" | "writing" | "math" | "mixed"

// First, let's update our Question type to include associated files
interface Question {
  id: string
  question: string // Changed from 'content' to 'question'
  difficulty: Difficulty
  section: Section
  files?: string[] // Add files array to store associated file names
  image?: string // Add image property
}

interface LLMMapping {
  id: string
  realName: string
  displayName: string
  prompt?: string // Add prompt field
}

// Add participant interface - simplified for setup
interface ExperimentParticipant {
  participantNumber: string
  llmId: string
  assignedQuestions: string[]
}

// Define a type for created experiments
interface Experiment {
  id: string
  name: string
  participant: ExperimentParticipant // Changed to single participant
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("middle")
  const [selectedSection, setSelectedSection] = useState<Section>("reading")
  const [llmMappings, setLlmMappings] = useState<LLMMapping[]>([
    { id: "1", realName: "gpt-4", displayName: "Sarah", prompt: "You are a helpful assistant." },
    { id: "2", realName: "gpt-3.5-turbo", displayName: "Peter", prompt: "You are a knowledgeable tutor." },
    { id: "3", realName: "claude-3-opus", displayName: "James", prompt: "You are an expert educator." },
    { id: "4", realName: "llama-3-70b", displayName: "Emily", prompt: "You are a patient teacher." },
    { id: "5", realName: "mistral-large", displayName: "Michael", prompt: "You are a supportive mentor." },
  ])
  const [selectedLLM, setSelectedLLM] = useState<string>("gpt-4")
  const [newLLMDisplayName, setNewLLMDisplayName] = useState<string>("")
  const [newLLMPrompt, setNewLLMPrompt] = useState<string>("")
  const [selectedParticipantLLM, setSelectedParticipantLLM] = useState<string>("")
  const [experimentName, setExperimentName] = useState<string>("")

  // Setup page state for participant creation
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [nextParticipantNumber, setNextParticipantNumber] = useState<number>(1)

  // State for created experiments
  const [experiments, setExperiments] = useState<Experiment[]>([])

  // State for editing experiments
  const [editingExperimentId, setEditingExperimentId] = useState<string | null>(null)
  const [editingExperimentName, setEditingExperimentName] = useState<string>("")
  const [editingExperimentQuestions, setEditingExperimentQuestions] = useState<string[]>([])
  const [editingExperimentLLM, setEditingExperimentLLM] = useState<string>("")

  // State for viewing experiment results
  const [viewingExperimentId, setViewingExperimentId] = useState<string | null>(null)
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false)

  // Filter states
  const [filterSection, setFilterSection] = useState<string>("all-sections")
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all-difficulties")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [uploadedMaterials, setUploadedMaterials] = useState<string[]>([])
  // Add a state to track pending uploads (files that haven't been associated with a question yet)
  const [pendingUploads, setPendingUploads] = useState<string[]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(true)

  // Add a new state for showing the file upload parser
  const [showFileUploadParser, setShowFileUploadParser] = useState(false)

  // Add a new state for editing LLM mappings
  const [editingLLMMappingId, setEditingLLMMappingId] = useState<string | null>(null)
  const [editingLLMModel, setEditingLLMModel] = useState<string>("")

  // Add a new state for editing the LLM display name and prompt
  const [editingLLMDisplayName, setEditingLLMDisplayName] = useState<string>("")
  const [editingLLMPrompt, setEditingLLMPrompt] = useState<string>("")

  // Add this state near the other state declarations
  const [selectedResultsParticipant, setSelectedResultsParticipant] = useState<string>("")

  // Load sample questions on mount
  useEffect(() => {
    // In a real app, you would fetch this from a database
    const sampleQuestions: Question[] = [
      {
        id: "1",
        question: "Read the passage and identify the main theme.", // Changed from 'content' to 'question'
        difficulty: "elementary",
        section: "reading",
      },
      {
        id: "2",
        question: "Analyze the given text and explain how machine learning differs from traditional programming.", // Changed from 'content' to 'question'
        difficulty: "middle",
        section: "reading",
      },
      {
        id: "3",
        question: "Write an essay about the impact of technology on society.",
        difficulty: "middle",
        section: "writing",
      },
      {
        id: "4",
        question: "Write a short essay discussing the ethical implications of AI in healthcare.",
        difficulty: "high",
        section: "writing",
      },
      {
        id: "5",
        question: "Solve for x: 2x + 5 = 15",
        difficulty: "elementary",
        section: "math",
      },
      {
        id: "6",
        question: "Find the area of a circle with radius 7 units.",
        difficulty: "middle",
        section: "math",
      },
      {
        id: "7",
        question: "Read the passage and solve the related math problem.",
        difficulty: "middle",
        section: "mixed",
      },
    ]
    setQuestions(sampleQuestions)

    // Add some sample experiments
    const sampleExperiments: Experiment[] = [
      {
        id: "exp1",
        name: "Reading Comprehension Study",
        participant: { participantNumber: "1", llmId: "1", assignedQuestions: ["1", "2"] },
        createdAt: new Date(2023, 10, 15),
      },
      {
        id: "exp2",
        name: "Math Skills Assessment",
        participant: { participantNumber: "2", llmId: "5", assignedQuestions: ["5", "6", "7"] },
        createdAt: new Date(2023, 11, 2),
      },
    ]
    setExperiments(sampleExperiments)

    // Set the next participant number based on existing experiments
    setNextParticipantNumber(3) // Since we have participants 1 and 2 in sample data
  }, [])

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    // This effect ensures that any changes in questions or LLMs are immediately
    // reflected in the setup section by triggering a re-render
  }, [questions, llmMappings])

  // Add a handler for importing questions
  const handleQuestionsImported = (importedQuestions: any[]) => {
    // Convert imported questions to the format expected by the app
    const newQuestions = importedQuestions.map((q) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      question: q.question,
      difficulty: q.difficulty,
      section: q.section,
      image: q.image, // Add image property
    }))

    // Add the new questions to the existing questions
    setQuestions([...questions, ...newQuestions])

    // Close the file upload parser
    setShowFileUploadParser(false)

    // If there are images, add them to uploadedMaterials
    const allImages = importedQuestions.filter((q) => q.image).map((q) => q.image)

    if (allImages.length > 0) {
      setUploadedMaterials([...uploadedMaterials, ...allImages])
    }
  }

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
    if (searchQuery.trim() !== "" && !question.question.toLowerCase().includes(searchQuery.toLowerCase())) {
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
        question: newQuestion.trim(),
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

  // Update the handleStartEditLLMMapping function to also set the display name and prompt
  const handleStartEditLLMMapping = (mapping: LLMMapping) => {
    setEditingLLMMappingId(mapping.id)
    setEditingLLMModel(mapping.realName)
    setEditingLLMDisplayName(mapping.displayName)
    setEditingLLMPrompt(mapping.prompt || "")
  }

  // Update the handleSaveEditLLMMapping function to save the updated display name and prompt
  const handleSaveEditLLMMapping = (id: string) => {
    setLlmMappings(
      llmMappings.map((mapping) =>
        mapping.id === id
          ? {
              ...mapping,
              realName: editingLLMModel,
              displayName: editingLLMDisplayName,
              prompt: editingLLMPrompt,
            }
          : mapping,
      ),
    )
    setEditingLLMMappingId(null)

    toast({
      title: "Mapping Updated",
      description: "The LLM mapping has been updated successfully.",
    })
  }

  const handleAddLLMMapping = () => {
    if (selectedLLM && newLLMDisplayName.trim()) {
      const newMapping: LLMMapping = {
        id: Date.now().toString(),
        realName: selectedLLM,
        displayName: newLLMDisplayName,
        prompt: newLLMPrompt.trim() || "You are a helpful assistant.",
      }
      setLlmMappings([...llmMappings, newMapping])
      setNewLLMDisplayName("")
      setNewLLMPrompt("")
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

  // Participant management functions for setup
  const handleToggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  // Toggle question selection when editing an experiment
  const handleToggleEditQuestionSelection = (questionId: string) => {
    setEditingExperimentQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
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

    if (!selectedParticipantLLM) {
      toast({
        title: "Error",
        description: "Please select an LLM for this participant.",
        variant: "destructive",
      })
      return
    }

    if (selectedQuestions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one question for this participant.",
        variant: "destructive",
      })
      return
    }

    // Create a new experiment with auto-incremented participant number
    const newExperiment: Experiment = {
      id: `exp-${Date.now()}`,
      name: experimentName,
      participant: {
        participantNumber: nextParticipantNumber.toString(),
        llmId: selectedParticipantLLM,
        assignedQuestions: [...selectedQuestions],
      },
      createdAt: new Date(),
    }

    // Add to experiments list
    setExperiments([...experiments, newExperiment])

    // Increment participant number for next experiment
    setNextParticipantNumber(nextParticipantNumber + 1)

    // Reset form
    setExperimentName("")
    setSelectedParticipantLLM("")
    setSelectedQuestions([])

    // Show success message
    toast({
      title: "Experiment Created",
      description: `Your experiment "${experimentName}" has been created with participant #${nextParticipantNumber}.`,
    })
  }

  // Start editing an experiment
  const handleStartEditExperiment = (experiment: Experiment) => {
    setEditingExperimentId(experiment.id)
    setEditingExperimentName(experiment.name)
    setEditingExperimentQuestions([...experiment.participant.assignedQuestions])
    setEditingExperimentLLM(experiment.participant.llmId)
  }

  // Save edited experiment
  const handleSaveEditExperiment = (id: string) => {
    if (!editingExperimentName.trim()) {
      toast({
        title: "Error",
        description: "Experiment name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    if (editingExperimentQuestions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one question.",
        variant: "destructive",
      })
      return
    }

    setExperiments(
      experiments.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              name: editingExperimentName,
              participant: {
                ...exp.participant,
                llmId: editingExperimentLLM,
                assignedQuestions: editingExperimentQuestions,
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

  // Delete experiment and adjust participant numbers
  const handleDeleteExperiment = (id: string) => {
    const experimentToDelete = experiments.find((exp) => exp.id === id)
    if (!experimentToDelete) return

    const deletedParticipantNumber = Number.parseInt(experimentToDelete.participant.participantNumber)

    // Remove the experiment
    const updatedExperiments = experiments.filter((exp) => exp.id !== id)

    // Adjust participant numbers for experiments with higher numbers
    const reorderedExperiments = updatedExperiments.map((exp) => {
      const currentParticipantNumber = Number.parseInt(exp.participant.participantNumber)
      if (currentParticipantNumber > deletedParticipantNumber) {
        return {
          ...exp,
          participant: {
            ...exp.participant,
            participantNumber: (currentParticipantNumber - 1).toString(),
          },
        }
      }
      return exp
    })

    setExperiments(reorderedExperiments)

    // Adjust the next participant number
    setNextParticipantNumber(Math.max(1, nextParticipantNumber - 1))

    toast({
      title: "Experiment Deleted",
      description: "The experiment has been deleted and participant numbers have been adjusted.",
    })
  }

  // View experiment results
  const handleViewResults = (experimentId: string) => {
    const experiment = experiments.find((exp) => exp.id === experimentId)
    if (experiment) {
      setViewingExperimentId(experimentId)
      setSelectedResultsParticipant(experiment.participant.participantNumber)
      setShowResultsDialog(true)
    }
  }

  // Reset filters
  const handleResetFilters = () => {
    // Reset filters
    setFilterSection("all-sections")
    setFilterDifficulty("all-difficulties")
    setSearchQuery("")

    // Reset questions
    setQuestions([])
    setUploadedMaterials([])

    toast({
      title: "Reset Complete",
      description: "All questions have been cleared and filters have been reset.",
    })
  }

  // Cancel editing LLM Mapping
  const handleCancelEditLLMMapping = () => {
    setEditingLLMMappingId(null)
  }

  // Get difficulty display label
  const getDifficultyLabel = (difficulty: Difficulty) => {
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
              <Calculator className="h-4 w-4 mr-2" />
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
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>Add and manage questions for each section.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFileUploadParser(true)}
                    className="flex items-center gap-1"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Import from File
                  </Button>
                </div>
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
                              <SelectItem value="math">Math</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="difficulty">Grade Level</Label>
                          <Select
                            value={selectedDifficulty}
                            onValueChange={(value) => setSelectedDifficulty(value as Difficulty)}
                          >
                            <SelectTrigger id="difficulty">
                              <SelectValue placeholder="Select grade level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="elementary">Elementary (K-5)</SelectItem>
                              <SelectItem value="middle">Middle School (6-8)</SelectItem>
                              <SelectItem value="high">High School (9-12)</SelectItem>
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
                        Supported: JPG, PNG (Max 10MB)
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
                          <SelectItem value="math">Math</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Grade Levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-difficulties">All Grade Levels</SelectItem>
                          <SelectItem value="elementary">Elementary (K-5)</SelectItem>
                          <SelectItem value="middle">Middle School (6-8)</SelectItem>
                          <SelectItem value="high">High School (9-12)</SelectItem>
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
                                      question.difficulty === "elementary"
                                        ? "outline"
                                        : question.difficulty === "middle"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {getDifficultyLabel(question.difficulty)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {question.section}
                                  </Badge>
                                </div>
                                {question.question && (
                                  <p className="text-sm dark:text-gray-300 mb-2">{question.question}</p>
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
                                {question.image && (
                                  <div className="mt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attached Image:</p>
                                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                      <ImageIcon className="h-3 w-3" />
                                      {question.image}
                                    </Badge>
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
                <CardDescription>Map LLM models to display names and set prompts for participants.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Add New Mapping</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
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
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="llm-prompt" className="text-xs">
                          System Prompt
                        </Label>
                        <Textarea
                          id="llm-prompt"
                          placeholder="You are a helpful assistant..."
                          value={newLLMPrompt}
                          onChange={(e) => setNewLLMPrompt(e.target.value)}
                          rows={3}
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
                  <ScrollArea className="h-[400px] p-4">
                    <div className="space-y-4">
                      {llmMappings.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                          No LLM mappings added yet. Add your first mapping above.
                        </p>
                      ) : (
                        llmMappings.map((mapping) => (
                          <div key={mapping.id} className="p-4 border rounded-md dark:border-gray-700">
                            {editingLLMMappingId === mapping.id ? (
                              // Editing mode
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium">Edit LLM Mapping</h4>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSaveEditLLMMapping(mapping.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleCancelEditLLMMapping}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-llm-model-${mapping.id}`} className="text-sm">
                                      LLM Model
                                    </Label>
                                    <Select value={editingLLMModel} onValueChange={setEditingLLMModel}>
                                      <SelectTrigger id={`edit-llm-model-${mapping.id}`}>
                                        <SelectValue placeholder="Select LLM model" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableLLMs.map((llm) => (
                                          <SelectItem key={llm.value} value={llm.value}>
                                            {llm.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Label htmlFor={`edit-display-name-${mapping.id}`} className="text-sm">
                                      Display Name
                                    </Label>
                                    <Input
                                      id={`edit-display-name-${mapping.id}`}
                                      value={editingLLMDisplayName}
                                      onChange={(e) => setEditingLLMDisplayName(e.target.value)}
                                      placeholder="e.g., Sarah"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-prompt-${mapping.id}`} className="text-sm">
                                      System Prompt
                                    </Label>
                                    <Textarea
                                      id={`edit-prompt-${mapping.id}`}
                                      value={editingLLMPrompt}
                                      onChange={(e) => setEditingLLMPrompt(e.target.value)}
                                      placeholder="You are a helpful assistant..."
                                      rows={4}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
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
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleStartEditLLMMapping(mapping)}
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4 text-blue-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteLLMMapping(mapping.id)}
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                                {mapping.prompt && (
                                  <div>
                                    <p className="text-sm font-medium dark:text-gray-200 mb-1">System Prompt:</p>
                                    <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                                      {mapping.prompt}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab - Simplified Setup */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Experiment Setup</CardTitle>
                <CardDescription>Create experiments with auto-assigned participant numbers.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-4">
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
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">Participant Setup</h3>
                      <Badge variant="outline" className="text-xs">
                        Participant #{nextParticipantNumber}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="participant-llm" className="text-sm">
                          Assign LLM
                        </Label>
                        <Select value={selectedParticipantLLM} onValueChange={setSelectedParticipantLLM}>
                          <SelectTrigger id="participant-llm">
                            <SelectValue placeholder="Select LLM" />
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

                    {/* Question Selection by Category */}
                    <div className="space-y-4">
                      <Label className="text-sm">Select Questions by Category</Label>

                      {/* Reading Questions */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium">Reading Questions</h4>
                          <Badge variant="outline" className="text-xs">
                            {
                              selectedQuestions.filter(
                                (id) => questions.find((q) => q.id === id)?.section === "reading",
                              ).length
                            }{" "}
                            selected
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto">
                          {questions
                            .filter((q) => q.section === "reading")
                            .map((question) => (
                              <div
                                key={question.id}
                                className={`p-2 border rounded cursor-pointer transition-colors text-xs ${
                                  selectedQuestions.includes(question.id)
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                                onClick={() => handleToggleQuestionSelection(question.id)}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {getDifficultyLabel(question.difficulty)}
                                  </Badge>
                                </div>
                                <p className="text-xs">{question.question}</p>
                              </div>
                            ))}
                          {questions.filter((q) => q.section === "reading").length === 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                              No reading questions available
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Writing Questions */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium">Writing Questions</h4>
                          <Badge variant="outline" className="text-xs">
                            {
                              selectedQuestions.filter(
                                (id) => questions.find((q) => q.id === id)?.section === "writing",
                              ).length
                            }{" "}
                            selected
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto">
                          {questions
                            .filter((q) => q.section === "writing")
                            .map((question) => (
                              <div
                                key={question.id}
                                className={`p-2 border rounded cursor-pointer transition-colors text-xs ${
                                  selectedQuestions.includes(question.id)
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                                onClick={() => handleToggleQuestionSelection(question.id)}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {getDifficultyLabel(question.difficulty)}
                                  </Badge>
                                </div>
                                <p className="text-xs">{question.question}</p>
                              </div>
                            ))}
                          {questions.filter((q) => q.section === "writing").length === 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                              No writing questions available
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Math Questions */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium">Math Questions</h4>
                          <Badge variant="outline" className="text-xs">
                            {
                              selectedQuestions.filter((id) => questions.find((q) => q.id === id)?.section === "math")
                                .length
                            }{" "}
                            selected
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto">
                          {questions
                            .filter((q) => q.section === "math")
                            .map((question) => (
                              <div
                                key={question.id}
                                className={`p-2 border rounded cursor-pointer transition-colors text-xs ${
                                  selectedQuestions.includes(question.id)
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                                onClick={() => handleToggleQuestionSelection(question.id)}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {getDifficultyLabel(question.difficulty)}
                                  </Badge>
                                </div>
                                <p className="text-xs">{question.question}</p>
                              </div>
                            ))}
                          {questions.filter((q) => q.section === "math").length === 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 py-2">No math questions available</p>
                          )}
                        </div>
                      </div>

                      {/* Mixed Questions */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium">Mixed Questions</h4>
                          <Badge variant="outline" className="text-xs">
                            {
                              selectedQuestions.filter((id) => questions.find((q) => q.id === id)?.section === "mixed")
                                .length
                            }{" "}
                            selected
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto">
                          {questions
                            .filter((q) => q.section === "mixed")
                            .map((question) => (
                              <div
                                key={question.id}
                                className={`p-2 border rounded cursor-pointer transition-colors text-xs ${
                                  selectedQuestions.includes(question.id)
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                                onClick={() => handleToggleQuestionSelection(question.id)}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {getDifficultyLabel(question.difficulty)}
                                  </Badge>
                                </div>
                                <p className="text-xs">{question.question}</p>
                              </div>
                            ))}
                          {questions.filter((q) => q.section === "mixed").length === 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                              No mixed questions available
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedQuestions.length > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Total: {selectedQuestions.length} question(s) selected across all categories
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      size="default"
                      onClick={handleGenerateExperiment}
                      className="px-8"
                      disabled={!experimentName.trim() || !selectedParticipantLLM || selectedQuestions.length === 0}
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
                                    <div className="space-y-2 flex-1 mr-4">
                                      <Label htmlFor={`edit-name-${experiment.id}`} className="text-sm">
                                        Experiment Name
                                      </Label>
                                      <Input
                                        id={`edit-name-${experiment.id}`}
                                        value={editingExperimentName}
                                        onChange={(e) => setEditingExperimentName(e.target.value)}
                                      />
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSaveEditExperiment(experiment.id)}
                                        className="h-8"
                                      >
                                        <Save className="h-4 w-4 mr-1" />
                                        Save
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEditExperiment}
                                        className="h-8"
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-llm-${experiment.id}`} className="text-sm">
                                      LLM Selection
                                    </Label>
                                    <Select value={editingExperimentLLM} onValueChange={setEditingExperimentLLM}>
                                      <SelectTrigger id={`edit-llm-${experiment.id}`}>
                                        <SelectValue placeholder="Select LLM" />
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

                                  <div className="space-y-2">
                                    <Label className="text-sm">Edit Questions</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {/* Reading Questions */}
                                      <div className="border rounded-md p-3">
                                        <h5 className="text-xs font-medium mb-2">Reading Questions</h5>
                                        <div className="max-h-[100px] overflow-y-auto space-y-1">
                                          {questions
                                            .filter((q) => q.section === "reading")
                                            .map((question) => (
                                              <div
                                                key={question.id}
                                                className={`p-1 border rounded cursor-pointer text-xs ${
                                                  editingExperimentQuestions.includes(question.id)
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700"
                                                }`}
                                                onClick={() => handleToggleEditQuestionSelection(question.id)}
                                              >
                                                <p className="text-xs truncate">{question.question}</p>
                                              </div>
                                            ))}
                                        </div>
                                      </div>

                                      {/* Writing Questions */}
                                      <div className="border rounded-md p-3">
                                        <h5 className="text-xs font-medium mb-2">Writing Questions</h5>
                                        <div className="max-h-[100px] overflow-y-auto space-y-1">
                                          {questions
                                            .filter((q) => q.section === "writing")
                                            .map((question) => (
                                              <div
                                                key={question.id}
                                                className={`p-1 border rounded cursor-pointer text-xs ${
                                                  editingExperimentQuestions.includes(question.id)
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700"
                                                }`}
                                                onClick={() => handleToggleEditQuestionSelection(question.id)}
                                              >
                                                <p className="text-xs truncate">{question.question}</p>
                                              </div>
                                            ))}
                                        </div>
                                      </div>

                                      {/* Math Questions */}
                                      <div className="border rounded-md p-3">
                                        <h5 className="text-xs font-medium mb-2">Math Questions</h5>
                                        <div className="max-h-[100px] overflow-y-auto space-y-1">
                                          {questions
                                            .filter((q) => q.section === "math")
                                            .map((question) => (
                                              <div
                                                key={question.id}
                                                className={`p-1 border rounded cursor-pointer text-xs ${
                                                  editingExperimentQuestions.includes(question.id)
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700"
                                                }`}
                                                onClick={() => handleToggleEditQuestionSelection(question.id)}
                                              >
                                                <p className="text-xs truncate">{question.question}</p>
                                              </div>
                                            ))}
                                        </div>
                                      </div>

                                      {/* Mixed Questions */}
                                      <div className="border rounded-md p-3">
                                        <h5 className="text-xs font-medium mb-2">Mixed Questions</h5>
                                        <div className="max-h-[100px] overflow-y-auto space-y-1">
                                          {questions
                                            .filter((q) => q.section === "mixed")
                                            .map((question) => (
                                              <div
                                                key={question.id}
                                                className={`p-1 border rounded cursor-pointer text-xs ${
                                                  editingExperimentQuestions.includes(question.id)
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700"
                                                }`}
                                                onClick={() => handleToggleEditQuestionSelection(question.id)}
                                              >
                                                <p className="text-xs truncate">{question.question}</p>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Total: {editingExperimentQuestions.length} question(s) selected
                                      </p>
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
                                    {/* Participant Badge */}
                                    <Badge variant="outline" className="text-xs">
                                      Participant #{experiment.participant.participantNumber}
                                    </Badge>

                                    {/* LLM Badge */}
                                    <Badge variant="outline" className="text-xs">
                                      {llmMappings.find((m) => m.id === experiment.participant.llmId)?.displayName ||
                                        "Unknown LLM"}
                                    </Badge>

                                    {/* Questions Badge */}
                                    <Badge variant="outline" className="text-xs">
                                      {experiment.participant.assignedQuestions.length} questions
                                    </Badge>

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
        selectedParticipant={selectedResultsParticipant}
        llmMappings={llmMappings}
      />
      {showFileUploadParser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <FileUploadParser
              onQuestionsImported={handleQuestionsImported}
              onClose={() => setShowFileUploadParser(false)}
            />
          </div>
        </div>
      )}
    </main>
  )
}
