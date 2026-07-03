import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { 
  useResumeList, 
  useUploadResume, 
  useReplaceResume, 
  useDeleteResume, 
  axios,
  CancelTokenSource 
} from "@/hooks/useResume";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import type { Resume } from "@/types/resume";

export function ResumePage() {
  const { data, isLoading, error, refetch } = useResumeList();
  const uploadMutation = useUploadResume();
  const replaceMutation = useReplaceResume();
  const deleteMutation = useDeleteResume();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // State
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [cancelSource, setCancelSource] = useState<CancelTokenSource | null>(null);
  
  // Replace target state
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  // Helper: Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Helper: Format ISO date string
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Unknown Date";
    }
  };

  // Drag handlers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndStartUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndStartUpload(e.target.files[0]);
    }
  };

  // Validate constraint boundaries and begin upload request
  const validateAndStartUpload = (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Invalid file type. Only PDF files are allowed.");
      return;
    }

    if (file.size === 0) {
      setUploadError("The selected file is empty.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5 MB constraint.");
      return;
    }

    setSelectedFile(file);
    startUpload(file);
  };

  const startUpload = (file: File) => {
    const source = axios.CancelToken.source();
    setCancelSource(source);

    uploadMutation.mutate(
      {
        file,
        onProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
        cancelSource: source
      },
      {
        onSuccess: () => {
          setUploadSuccess(true);
          setSelectedFile(null);
          setCancelSource(null);
          refetch();
        },
        onError: (err: any) => {
          if (axios.isCancel(err)) {
            setUploadError("Upload cancelled by user.");
          } else {
            const errMsg = err.response?.data?.error?.message || err.message || "Failed to upload file.";
            setUploadError(errMsg);
          }
          setSelectedFile(null);
          setCancelSource(null);
        }
      }
    );
  };

  const cancelUpload = () => {
    if (cancelSource) {
      cancelSource.cancel("Upload aborted by user.");
    }
  };

  const retryUpload = () => {
    if (selectedFile) {
      validateAndStartUpload(selectedFile);
    }
  };

  // Replace handlers
  const triggerReplaceFileInput = (resumeId: string) => {
    setReplaceTargetId(resumeId);
    setTimeout(() => {
      replaceInputRef.current?.click();
    }, 100);
  };

  const handleReplaceFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && replaceTargetId) {
      const file = e.target.files[0];
      
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        alert("Only PDF files are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5 MB constraint.");
        return;
      }

      // Trigger replacement mutation
      replaceMutation.mutate({
        id: replaceTargetId,
        file
      }, {
        onSuccess: () => {
          alert("Resume replaced successfully.");
          setReplaceTargetId(null);
          refetch();
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.error?.message || err.message || "Failed to replace resume.";
          alert(errMsg);
          setReplaceTargetId(null);
        }
      });
    }
  };

  // Delete handler
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch();
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.error?.message || err.message || "Failed to delete resume.";
          alert(errMsg);
        }
      });
    }
  };

  // Download trigger
  const handleDownload = (resume: Resume) => {
    // Generate secure relative link matching standard router endpoints
    const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/resumes/${resume.id}/download`;
    // Open in new tab or trigger link download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = resume.original_filename;
    link.click();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 260, damping: 25 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-6 md:p-12 max-w-[1280px] mx-auto w-full space-y-8 text-[#dae2fd]"
    >
      {/* Page Header */}
      <motion.div variants={cardVariants} className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">description</span>
          My Resume
        </h1>
        <p className="text-sm md:text-base text-on-surface-variant max-w-xl">
          Upload and manage your resumes for AI-powered evaluation, ATS optimization, and feedback.
        </p>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Upload Zone */}
        <motion.div variants={cardVariants} className="lg:col-span-5 space-y-6">
          <Card className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Upload New Resume</h3>
            
            {/* Drag & Drop Input Target */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(79,70,229,0.25)]" 
                  : "border-white/10 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="application/pdf"
              />
              <span className="material-symbols-outlined text-4xl text-primary/80 mb-3">cloud_upload</span>
              <p className="text-sm font-semibold text-white">Drag &amp; Drop your resume</p>
              <p className="text-xs text-on-surface-variant mt-1.5">Accepts PDF files only up to 5 MB</p>
              <span className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-colors">
                Browse Files
              </span>
            </div>

            {/* Active upload status or errors */}
            <AnimatePresence mode="wait">
              {selectedFile && uploadMutation.isPending && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white truncate max-w-[200px]">{selectedFile.name}</span>
                    <span className="font-mono text-primary font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                    <span>{formatBytes(selectedFile.size)}</span>
                    <button 
                      onClick={cancelUpload}
                      className="text-error font-semibold hover:underline"
                    >
                      Cancel Upload
                    </button>
                  </div>
                </motion.div>
              )}

              {uploadError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-error/15 border border-error/20 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-error">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{uploadError}</span>
                  </div>
                  <div className="flex gap-4 text-xs font-bold pt-1">
                    <button onClick={retryUpload} className="text-white hover:underline">Retry</button>
                    <button onClick={() => setUploadError(null)} className="text-on-surface-variant hover:underline font-normal">Dismiss</button>
                  </div>
                </motion.div>
              )}

              {uploadSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-success/15 border border-success/20 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-success text-2xl">check_circle</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Upload Complete</h4>
                    <p className="text-[10px] text-success/80 mt-0.5">Resume saved and queueing for analysis.</p>
                  </div>
                  <button onClick={() => setUploadSuccess(false)} className="ml-auto text-xs text-on-surface-variant hover:text-white">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Right Side: Resumes Dashboard List */}
        <motion.div variants={cardVariants} className="lg:col-span-7 space-y-6">
          <Card className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white tracking-tight">Uploaded Resumes</h3>
              <Badge variant="neutral">{(data?.resumes || []).length} Total</Badge>
            </div>

            {/* Hidden replace input */}
            <input 
              type="file" 
              ref={replaceInputRef} 
              onChange={handleReplaceFileChange} 
              className="hidden" 
              accept="application/pdf"
            />

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-xs text-on-surface-variant">Loading resumes...</span>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-error">
                <span className="material-symbols-outlined text-3xl mb-2 block">error</span>
                <p className="text-sm font-semibold">Failed to fetch resume list.</p>
                <button onClick={() => refetch()} className="mt-3 text-xs text-primary font-bold hover:underline">Retry Loading</button>
              </div>
            ) : (data?.resumes || []).length === 0 ? (
              <div className="py-16 text-center border border-dashed border-white/5 rounded-xl">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">folder_open</span>
                <p className="text-sm font-semibold text-white">No resumes uploaded yet</p>
                <p className="text-xs text-on-surface-variant mt-1">Upload your first resume on the left to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Responsive Bento Grid / Stacked List */}
                <div className="space-y-4">
                  {data?.resumes.map((resume) => (
                    <motion.div 
                      key={resume.id}
                      layoutId={resume.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start gap-3 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-xl">picture_as_pdf</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate max-w-[250px] md:max-w-[350px]" title={resume.original_filename}>
                            {resume.original_filename}
                          </h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-on-surface-variant font-mono">
                            <span>{formatBytes(resume.file_size)}</span>
                            <span>•</span>
                            <span>{formatDate(resume.uploaded_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        {/* Status Badge */}
                        <Badge 
                          variant={
                            resume.status === "completed" 
                              ? "success" 
                              : resume.status === "processing" 
                                ? "secondary" 
                                : resume.status === "failed" 
                                  ? "error" 
                                  : "warning"
                          }
                        >
                          {resume.status}
                        </Badge>

                        {/* Actions Control Deck */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDownload(resume)}
                            className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                          </button>
                          <button 
                            onClick={() => triggerReplaceFileInput(resume.id)}
                            className="p-2 hover:bg-white/10 text-primary rounded-lg transition-colors"
                            title="Replace Resume"
                            disabled={replaceMutation.isPending && replaceTargetId === resume.id}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {replaceMutation.isPending && replaceTargetId === resume.id ? "sync" : "sync_alt"}
                            </span>
                          </button>
                          <button 
                            onClick={() => handleDelete(resume.id)}
                            className="p-2 hover:bg-white/10 text-error rounded-lg transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
        
      </div>
    </motion.div>
  );
}
