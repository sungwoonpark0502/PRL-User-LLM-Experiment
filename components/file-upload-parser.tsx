"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle, FileSpreadsheet, FileJson, Upload, X, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Define the expected structure of questions in the uploaded file
interface QuestionImport {
  question: string
  section: "reading" | "writing" | "coding" | "mixed"
  difficulty: "easy" | "medium" | "hard"
  image?: string // Add image property
}

interface FileUploadParserProps {
  onQuestionsImported: (questions: QuestionImport[]) => void
  onClose: () => void
}

export function FileUploadParser({ onQuestionsImported, onClose }: FileUploadParserProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parsedQuestions, setParsedQuestions] = useState<QuestionImport[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Record<number, boolean>>({})
  const [imageAttachments, setImageAttachments] = useState<Record<number, string>>({})
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check if file is JSON or Excel (xlsx/xls/csv)
      const fileType = selectedFile.type
      const fileName = selectedFile.name.toLowerCase()

      if (
        fileType === "application/json" ||
        fileName.endsWith(".json") ||
        fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        fileName.endsWith(".xlsx") ||
        fileType === "application/vnd.ms-excel" ||
        fileName.endsWith(".xls") ||
        fileType === "text/csv" ||
        fileName.endsWith(".csv")
      ) {
        setFile(selectedFile)
        setParseErrors([])
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JSON, XLSX, XLS, or CSV file.",
          variant: "destructive",
        })
      }
    }
  }

  const parseFile = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setParsedQuestions([])
    setParseErrors([])
    setSelectedQuestions({})
    setImageAttachments({})

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        return newProgress >= 90 ? 90 : newProgress
      })
    }, 200)

    try {
      // Read the file
      const text = await file.text()
      let data

      // Check file extension to determine how to parse
      const fileName = file.name.toLowerCase()

      try {
        if (fileName.endsWith(".json")) {
          // Parse JSON file
          data = JSON.parse(text)

          // Validate the data structure
          if (!Array.isArray(data)) {
            throw new Error("JSON file must contain an array of questions")
          }
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
          // For this demo, we'll simulate parsing Excel/CSV files
          // In a real implementation, you would use libraries like xlsx, exceljs, or papaparse

          toast({
            title: "Demo Mode",
            description: "In this demo, please use the sample JSON file format instead of Excel/CSV.",
          })

          // Provide sample data structure for demo purposes
          data = [
            {
              question: "Sample question from Excel/CSV",
              section: "reading",
              difficulty: "medium",
            },
          ]
        } else {
          throw new Error("Unsupported file format. Please upload a JSON, XLSX, XLS, or CSV file.")
        }

        const validQuestions: QuestionImport[] = []
        const errors: string[] = []

        // Validate each question
        data.forEach((item, index) => {
          if (!item.question) {
            errors.push(`Question ${index + 1}: Missing question text`)
            return
          }

          if (!["reading", "writing", "coding", "mixed"].includes(item.section)) {
            errors.push(`Question ${index + 1}: Invalid section "${item.section}"`)
            return
          }

          if (!["easy", "medium", "hard"].includes(item.difficulty)) {
            errors.push(`Question ${index + 1}: Invalid difficulty "${item.difficulty}"`)
            return
          }

          validQuestions.push({
            question: item.question,
            section: item.section as "reading" | "writing" | "coding" | "mixed",
            difficulty: item.difficulty as "easy" | "medium" | "hard",
          })
        })

        setParsedQuestions(validQuestions)
        setParseErrors(errors)

        if (validQuestions.length > 0) {
          toast({
            title: "File Parsed Successfully",
            description: `Found ${validQuestions.length} valid questions${errors.length > 0 ? ` with ${errors.length} errors` : ""}`,
          })
        } else if (errors.length > 0) {
          toast({
            title: "Parsing Failed",
            description: "No valid questions found. Please check the file format.",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Error parsing file:", error)
        setParseErrors([`Error parsing file: ${error.message || "Invalid file format"}`])
        toast({
          title: "Parsing Error",
          description: `Failed to parse the file: ${error.message || "Invalid format"}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error reading file:", error)
      setParseErrors([`Failed to read the file: ${error.message || "Unknown error"}`])
      toast({
        title: "Upload Error",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setUploadProgress(100)
      setTimeout(() => setIsUploading(false), 500)
    }
  }

  const handleImport = () => {
    if (parsedQuestions.length > 0) {
      // Add image attachments to the questions
      const questionsWithImages = parsedQuestions.map((question, index) => {
        if (imageAttachments[index]) {
          return {
            ...question,
            image: imageAttachments[index],
          }
        }
        return question
      })

      onQuestionsImported(questionsWithImages)
      toast({
        title: "Questions Imported",
        description: `Successfully imported ${parsedQuestions.length} questions.`,
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, questionIndex: number) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]

      // In a real app, you would upload this to a server and get a URL
      // For this demo, we'll just store the file name
      setImageAttachments({
        ...imageAttachments,
        [questionIndex]: file.name,
      })

      toast({
        title: "Image Attached",
        description: `Image "${file.name}" attached to question ${questionIndex + 1}.`,
      })

      // Reset the file input
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  const handleToggleQuestion = (index: number) => {
    setSelectedQuestions({
      ...selectedQuestions,
      [index]: !selectedQuestions[index],
    })
  }

  const handleAttachImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Questions from File
        </CardTitle>
        <CardDescription>
          Upload a JSON or Excel file with question data to automatically import questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div className="border-2 border-dashed rounded-md p-6 text-center dark:border-gray-700">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Drag and drop your file here, or click to browse
            </p>
            <Input
              id="file-upload"
              type="file"
              accept=".json,.xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
              Select File
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Supported formats: JSON, XLSX, XLS, CSV</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {file.name.toLowerCase().endsWith(".json") ? (
                  <FileJson className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileSpreadsheet className="h-5 w-5 text-green-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={isUploading}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isUploading ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading and parsing...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            ) : (
              <Button className="w-full" onClick={parseFile} disabled={!file}>
                Parse File
              </Button>
            )}

            {parsedQuestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Questions ({parsedQuestions.length})</h3>
                  <Badge variant="outline" className="text-xs">
                    {parseErrors.length > 0 ? `${parseErrors.length} errors` : "No errors"}
                  </Badge>
                </div>

                {/* Hidden image input for attaching images */}
                <Input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    // Find the first selected question
                    const selectedEntry = Object.entries(selectedQuestions).find(([_, isSelected]) => isSelected)

                    if (selectedEntry) {
                      const selectedIndex = Number.parseInt(selectedEntry[0])
                      handleImageUpload(e, selectedIndex)
                    }
                  }}
                />

                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-gray-500">Select questions to attach images</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAttachImage}
                    disabled={Object.values(selectedQuestions).filter(Boolean).length === 0}
                    className="flex items-center gap-1"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Attach Image
                  </Button>
                </div>

                <ScrollArea className="h-[300px] border rounded-md p-2">
                  <div className="space-y-2">
                    {parsedQuestions.map((question, index) => (
                      <div
                        key={index}
                        className={`border rounded-md p-3 text-sm ${
                          selectedQuestions[index] ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`question-${index}`}
                            checked={selectedQuestions[index] || false}
                            onCheckedChange={() => handleToggleQuestion(index)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {question.section}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.difficulty}
                              </Badge>
                              {imageAttachments[index] && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {imageAttachments[index]}
                                </Badge>
                              )}
                            </div>
                            <Label htmlFor={`question-${index}`} className="text-sm cursor-pointer">
                              {question.question}
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {parseErrors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-1 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  Errors
                </h3>
                <ScrollArea className="h-[100px] border border-red-200 rounded-md p-2 bg-red-50 dark:bg-red-900/10 dark:border-red-900/20">
                  <div className="space-y-1">
                    {parseErrors.map((error, index) => (
                      <p key={index} className="text-xs text-red-600 dark:text-red-400">
                        • {error}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={parsedQuestions.length === 0 || isUploading}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Import {parsedQuestions.length} Questions
        </Button>
      </CardFooter>
    </Card>
  )
}
