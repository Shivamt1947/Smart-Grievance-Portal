import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import {
  Sparkles,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  X,
  Layers,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const NewGrievance: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT / Network');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // AI draft suggestions state
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  // Duplicate Warning Modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Handle AI analysis trigger
  const handleAnalyzeDraft = async () => {
    if (!description.trim() && !title.trim()) {
      setFormError('Please enter at least a few words in title or description to analyze.');
      return;
    }
    setFormError('');
    setIsAiAnalyzing(true);

    try {
      const res = await api.post('/ai/assist-draft', {
        title,
        description,
        location,
      });

      if (res.data.success) {
        setAiSuggestion(res.data.suggestions);
      }
    } catch {
      setFormError('AI suggestion service currently unavailable.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleApplyAiSuggestions = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.suggestedTitle) setTitle(aiSuggestion.suggestedTitle);
    if (aiSuggestion.suggestedCategory) setCategory(aiSuggestion.suggestedCategory);
    if (aiSuggestion.suggestedPriority) setPriority(aiSuggestion.suggestedPriority);
    if (aiSuggestion.suggestedLocation && !location) setLocation(aiSuggestion.suggestedLocation);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 4);
      setSelectedFiles(filesArray);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitGrievancePayload = async (forceSubmit = false) => {
    setIsSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('location', location.trim());
      formData.append('priority', priority);
      if (forceSubmit) {
        formData.append('forceSubmit', 'true');
      }

      selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      const res = await api.post('/grievances', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        navigate(`/student/grievances/${res.data.grievance._id}`);
      }
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.isDuplicateWarning) {
        setDuplicateData(err.response.data.duplicateGrievance);
        setDuplicateModalOpen(true);
      } else {
        setFormError(err.response?.data?.message || err.message || 'Submission failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    await submitGrievancePayload(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1 px-0.5 sm:px-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Submit Official Grievance
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          File a ticket with departmental oversight. Every ticket is subject to strict 24-hour resolution SLA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleFormSubmit}>
              <CardContent className="p-6 space-y-5">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs">
                    {formError}
                  </div>
                )}

                <Input
                  label="Grievance Title"
                  required
                  placeholder="e.g. Broken bench and flickering light in Lecture Hall 102"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  helperText="Brief summary of the issue"
                />

                <Textarea
                  label="Detailed Description"
                  required
                  rows={5}
                  placeholder="Describe what occurred, when it started, and how it impacts your studies..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Academic">Academic</option>
                    <option value="Examination">Examination</option>
                    <option value="IT / Network">IT / Network</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Library">Library</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Fees">Fees</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Administration">Administration</option>
                    <option value="Transport">Transport</option>
                    <option value="Other">Other</option>
                  </Select>

                  <Input
                    label="Exact Location"
                    required
                    placeholder="e.g. Lab 3, 2nd Floor, CS Block"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          priority === p
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attachments Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Supporting Documents / Images (Optional, max 4)
                  </label>
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 transition-colors">
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Upload screenshots, receipts, or photos (JPEG, PNG, PDF up to 5MB)
                    </p>
                    <label className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-sm">
                      Select Files
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {selectedFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <span className="truncate max-w-xs">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/student/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} className="font-bold px-6">
                    Submit Grievance
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>

        {/* AI Assistant Sidebar (1 col) */}
        <div className="space-y-4">
          <Card className="border-blue-200 dark:border-blue-900/60 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">AI Grievance Assistant</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Click below to let AI analyze your complaint, polish the title, and verify category/priority.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <Button
                type="button"
                onClick={handleAnalyzeDraft}
                isLoading={isAiAnalyzing}
                variant="outline"
                className="w-full text-xs font-semibold gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Analyze Draft with AI</span>
              </Button>

              {aiSuggestion && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-blue-950 dark:text-blue-200 font-bold">
                    <span>AI Analysis Suggestions</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200/80 dark:bg-blue-900 font-mono">
                      {Math.round((aiSuggestion.confidence || 0.9) * 100)}% match
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Suggested Title:
                      </span>
                      <p className="text-slate-900 dark:text-white font-medium mt-0.5">
                        {aiSuggestion.suggestedTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Category:
                      </span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {aiSuggestion.suggestedCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Priority:
                      </span>
                      <PriorityBadge priority={aiSuggestion.suggestedPriority} />
                    </div>

                    {aiSuggestion.missingInfo && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <span>{aiSuggestion.missingInfo}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyAiSuggestions}
                      className="w-full text-xs font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Apply AI Suggestions
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAiSuggestion(null)}
                      className="text-xs"
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  <span>Student Remains in Control</span>
                </div>
                <p>
                  AI only assists with suggestions. You can edit every title, category, and priority before final filing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      <Modal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        title="Possible Duplicate Grievance Found"
        description="Our duplicate detection engine discovered an existing active ticket submitted by you with similar details."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Preventing duplicate filings ensures faculty officers can focus on resolving your active complaint within the 24-hour SLA period.
            </span>
          </div>

          {duplicateData && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-600">
                  {duplicateData.grievance.trackingId}
                </span>
                <StatusBadge status={duplicateData.grievance.status} />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {duplicateData.grievance.title}
              </h4>
              <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                {duplicateData.grievance.description}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>📍 {duplicateData.grievance.location}</span>
                <span className="font-semibold text-amber-600">
                  {duplicateData.similarity}% semantic similarity
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
            {duplicateData && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(`/student/grievances/${duplicateData.grievance.id}`)}
              >
                View Existing Grievance
              </Button>
            )}
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => {
                setDuplicateModalOpen(false);
                submitGrievancePayload(true);
              }}
            >
              This is Different — Continue Submission
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
