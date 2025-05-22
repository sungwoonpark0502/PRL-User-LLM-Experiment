"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, FileSpreadsheet, FileJson, Upload, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import supabase from '@/lib/supabase';

interface QuestionImport {
  question: string;
  section: "reading" | "writing" | "coding" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  image?: string;
}

interface FileUploadParserProps {
  onQuestionsImported: (questions: QuestionImport[]) => void;
  onClose: () => void;
}

export function FileUploadParser({ onQuestionsImported, onClose }: FileUploadParserProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedQuestions, setParsedQuestions] = useState<QuestionImport[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Record<number, boolean>>({});
  const [imageAttachments, setImageAttachments] = useState<Record<number, string>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Debug useEffect
  useEffect(() => {
    console.log('FileUploadParser mounted');
    console.log('Supabase client:', supabase);
    console.log('Environment variables:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      const fileName = selectedFile.name.toLowerCase();

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
        setFile(selectedFile);
        setParseErrors([]);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JSON, XLSX, XLS, or CSV file.",
          variant: "destructive",
        });
      }
    }
  };

  const parseFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setParsedQuestions([]);
    setParseErrors([]);
    setSelectedQuestions({});
    setImageAttachments({});

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 200);

    try {
      const text = await file.text();
      let data;

      const fileName = file.name.toLowerCase();

      try {
        if (fileName.endsWith(".json")) {
          data = JSON.parse(text);

          if (!Array.isArray(data)) {
            throw new Error("JSON file must contain an array of questions");
          }
        } else {
          toast({
            title: "Demo Mode",
            description: "Please use JSON file format for this demo.",
          });
          data = [
            {
              question: "Sample question from file",
              section: "reading",
              difficulty: "medium",
            },
          ];
        }

        const validQuestions: QuestionImport[] = [];
        const errors: string[] = [];

        data.forEach((item, index) => {
          if (!item.question) {
            errors.push(`Question ${index + 1}: Missing question text`);
            return;
          }

          if (!["reading", "writing", "coding", "mixed"].includes(item.section)) {
            errors.push(`Question ${index + 1}: Invalid section "${item.section}"`);
            return;
          }

          if (!["easy", "medium", "hard"].includes(item.difficulty)) {
            errors.push(`Question ${index + 1}: Invalid difficulty "${item.difficulty}"`);
            return;
          }

          validQuestions.push({
            question: item.question,
            section: item.section as "reading" | "writing" | "coding" | "mixed",
            difficulty: item.difficulty as "easy" | "medium" | "hard",
          });
        });

        setParsedQuestions(validQuestions);
        setParseErrors(errors);

        if (validQuestions.length > 0) {
          toast({
            title: "File Parsed Successfully",
            description: `Found ${validQuestions.length} valid questions${errors.length > 0 ? ` with ${errors.length} errors` : ""}`,
          });
        } else if (errors.length > 0) {
          toast({
            title: "Parsing Failed",
            description: "No valid questions found. Please check the file format.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error parsing file:", error);
        setParseErrors([`Error parsing file: ${error.message || "Invalid file format"}`]);
        toast({
          title: "Parsing Error",
          description: `Failed to parse the file: ${error.message || "Invalid format"}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error reading file:", error);
      setParseErrors([`Failed to read the file: ${error.message || "Unknown error"}`]);
      toast({
        title: "Upload Error",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => setIsUploading(false), 500);
    }
  };

  const handleQuestionsImported = async (questions: QuestionImport[]) => {
    console.log('Attempting to insert questions:', questions);
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(
          questions.map((q) => ({
            content: q.question,
            section: q.section,
            difficulty: q.difficulty,
            image_url: q.image || null,
          }))
        )
        .select();

      console.log('Supabase insert response:', { data, error });

      if (error) {
        throw error;
      }

      toast({
        title: "Questions Saved",
        description: `${questions.length} questions added to the database.`,
      });
      
      onQuestionsImported(questions);
    } catch (error: any) {
      console.error('Error inserting questions:', error);
      toast({
        title: "Insert Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    if (parsedQuestions.length > 0) {
      const questionsWithImages = parsedQuestions.map((question, index) => ({
        ...question,
        image: imageAttachments[index] || undefined,
      }));

      handleQuestionsImported(questionsWithImages);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, questionIndex: number) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setImageAttachments({
        ...imageAttachments,
        [questionIndex]: file.name,
      });

      toast({
        title: "Image Attached",
        description: `Image "${file.name}" attached to question ${questionIndex + 1}.`,
      });

      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleToggleQuestion = (index: number) => {
    setSelectedQuestions({
      ...selectedQuestions,
      [index]: !selectedQuestions[index],
    });
  };

  const handleAttachImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

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
        {/* ... (rest of your JSX remains the same) ... */}
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
  );
}