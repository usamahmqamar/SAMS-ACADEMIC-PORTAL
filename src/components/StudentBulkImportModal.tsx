import React, { useState, useRef, useMemo } from 'react';
import { 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ChevronRight, 
  ArrowLeft, 
  Trash2, 
  Search, 
  Sparkles, 
  Building2, 
  Users, 
  HelpCircle, 
  Check, 
  AlertCircle,
  FileText,
  Copy,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  level: 'nursery' | 'primary' | 'secondary';
  grade: string;
  classSection?: string;
  branch: 'GN' | 'RS';
  status: string;
  feeStatus: string;
  balance: number;
  totalPaid: number;
  totalDiscount: number;
  serialNumber?: number;
  admissionSession?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  gender?: 'Male' | 'Female';
  dob?: string;
  bloodGroup?: string;
  genotype?: string;
  allergies?: string;
  medicalConditions?: string;
  emergencyContact?: string;
  previousSchool?: string;
  grades?: Record<string, number>;
  milestones?: Record<string, boolean>;
  notes?: string;
  [key: string]: any;
}

interface StudentBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newStudents: Student[]) => void;
  existingStudents: Student[];
  currentBranch?: 'All' | 'GN' | 'RS';
}

export interface ParsedStudentRow {
  id: string;
  selected: boolean;
  name: string;
  level: 'nursery' | 'primary' | 'secondary';
  grade: string;
  classSection: string;
  branch: 'GN' | 'RS';
  enrollmentNo?: string;
  isCustomAdmissionNo: boolean;
  allocatedAdmissionNo?: string;
  serialNumber?: number;
  gender: 'Male' | 'Female';
  dob: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  bloodGroup: string;
  sessionYear: string;
  hasErrors: boolean;
  errors: string[];
  warnings: string[];
}

const TEMPLATE_CSV_CONTENT = `Full Name,Level,Grade,Class Section,Branch,Admission Number,Gender,Date of Birth,Parent Name,Parent Phone,Parent Email,Residential Address,Blood Group
Muhammad Aminu Bello,primary,Grade 1,A,GN,GN2004001,Male,2018-04-15,Aminu Bello,+234 803 111 2233,aminu.bello@example.com,Gawun Nama Area Sokoto,O+
Fatima Zaynab Umar,primary,Grade 3,B,GN,,Female,2016-08-20,Umar Farouk,+234 802 333 4455,umar.farouk@example.com,Kano Road Sokoto,A+
Ibrahim Khadija Aliyu,nursery,K1 (Ages 3-4),A,RS,RS2102005,Female,2021-02-10,Aliyu Danladi,+234 805 777 8899,aliyu.d@example.com,Runjin Sambo West Sokoto,O+
Abubakar Sadik Yahaya,secondary,Grade 9,A,RS,,Male,2011-11-05,Yahaya Ahmad,+234 806 555 6677,yahaya.ahmad@example.com,Runjin Sambo Area Sokoto,B+
Amina Hassan Danbaba,primary,Grade 2,A,GN,,Female,2017-09-12,Hassan Danbaba,+234 809 123 4567,hassan.d@example.com,Gawun Nama Sokoto,O+`;

export const StudentBulkImportModal: React.FC<StudentBulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingStudents,
  currentBranch = 'GN'
}) => {
  // Wizard Steps: 1 = Upload / Paste, 2 = Review & Validate, 3 = Confirm Dialogue, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  
  // Configuration Settings
  const [defaultBranch, setDefaultBranch] = useState<'GN' | 'RS'>(currentBranch === 'RS' ? 'RS' : 'GN');
  const [defaultSession, setDefaultSession] = useState<string>('26');
  const [preservePreviousPortalIds, setPreservePreviousPortalIds] = useState<boolean>(true);
  const [startSerialInput, setStartSerialInput] = useState<string>('');
  
  // Raw input state
  const [rawPastedText, setRawPastedText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Parsed rows state
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [showSpecGuide, setShowSpecGuide] = useState<boolean>(false);
  
  // Processing and result state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importedResults, setImportedResults] = useState<Student[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  // Derive highest serial number from existing database
  const calculatedNextSerial = useMemo(() => {
    return existingStudents.reduce((max, s) => Math.max(max, Number(s.serialNumber) || 0), 1000) + 1;
  }, [existingStudents]);

  // 1. Download CSV Template
  const handleDownloadTemplate = () => {
    const blob = new Blob(["\uFEFF" + TEMPLATE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sams_student_onboarding_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper: map grade names to codes
  const getLiveClassCode = (grade: string): string => {
    const g = (grade || '').toLowerCase().trim();
    if (g.includes('preschool') || g.includes('nursery 1') || g.includes('creche')) return '01';
    if (g.includes('k1') || g.includes('nursery 2')) return '02';
    if (g.includes('k2') || g.includes('nursery 3')) return '03';
    if (g.includes('grade 1') || g.includes('primary 1') || g.includes('basic 1')) return '04';
    if (g.includes('grade 2') || g.includes('primary 2') || g.includes('basic 2')) return '05';
    if (g.includes('grade 3') || g.includes('primary 3') || g.includes('basic 3')) return '06';
    if (g.includes('grade 4') || g.includes('primary 4') || g.includes('basic 4')) return '07';
    if (g.includes('grade 5') || g.includes('primary 5') || g.includes('basic 5')) return '08';
    if (g.includes('grade 6') || g.includes('primary 6') || g.includes('basic 6')) return '09';
    if (g.includes('grade 7') || g.includes('jss 1') || g.includes('basic 7')) return '10';
    if (g.includes('grade 8') || g.includes('jss 2') || g.includes('basic 8')) return '11';
    if (g.includes('grade 9') || g.includes('jss 3') || g.includes('basic 9')) return '12';
    if (g.includes('grade 10') || g.includes('ss 1') || g.includes('sss 1')) return '13';
    if (g.includes('grade 11') || g.includes('ss 2') || g.includes('sss 2')) return '14';
    if (g.includes('grade 12') || g.includes('ss 3') || g.includes('sss 3')) return '15';
    return '04';
  };

  // Helper: determine level from grade
  const deduceLevel = (grade: string): 'nursery' | 'primary' | 'secondary' => {
    const g = grade.toLowerCase();
    if (g.includes('preschool') || g.includes('k1') || g.includes('k2') || g.includes('nursery') || g.includes('creche')) {
      return 'nursery';
    }
    if (g.includes('grade 9') || g.includes('grade 10') || g.includes('grade 11') || g.includes('grade 12') || g.includes('jss') || g.includes('sss') || g.includes('secondary')) {
      return 'secondary';
    }
    return 'primary';
  };

  // Parser: converts raw CSV or TSV text into parsed student records
  const parseRawTextToRows = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      alert("No data found in the input. Please upload a CSV or paste tabular text.");
      return;
    }

    // Determine delimiter (comma, tab, or semicolon)
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    
    let delimiter = ',';
    if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
    else if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';

    const parseLine = (line: string): string[] => {
      if (delimiter === '\t') {
        return line.split('\t').map(c => c.replace(/^["']|["']$/g, '').trim());
      }
      // Regex for CSV parsing that handles quotes
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result.map(c => c.replace(/^["']|["']$/g, '').trim());
    };

    const headerCells = parseLine(firstLine).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Check if line 0 is a header row
    const hasHeader = headerCells.some(h => 
      h.includes('name') || h.includes('grade') || h.includes('class') || h.includes('level') || h.includes('admission') || h.includes('adm')
    );

    const dataLines = hasHeader ? lines.slice(1) : lines;

    // Header index mapping
    const colMap: Record<string, number> = {};
    if (hasHeader) {
      headerCells.forEach((h, idx) => {
        if (h.includes('fullname') || (h.includes('name') && !h.includes('parent') && !h.includes('guardian') && !h.includes('father') && !h.includes('mother'))) colMap.name = idx;
        if (h.includes('level') || h.includes('wing') || h.includes('stage') || h.includes('division')) colMap.level = idx;
        if (h.includes('grade') || h.includes('class') || h.includes('standard')) colMap.grade = idx;
        if (h.includes('section') || h.includes('arm') || h.includes('stream')) colMap.section = idx;
        if (h.includes('branch') || h.includes('campus') || h.includes('site')) colMap.branch = idx;
        if (h.includes('admission') || h.includes('adm') || h.includes('reg') || h.includes('matric') || h.includes('studentid') || (h === 'id' && !colMap.id)) colMap.enrollmentNo = idx;
        if (h.includes('gender') || h.includes('sex')) colMap.gender = idx;
        if (h.includes('dob') || h.includes('birth')) colMap.dob = idx;
        if (h.includes('parentname') || h.includes('guardianname') || h.includes('parent') || h.includes('guardian') || h.includes('father') || h.includes('mother')) colMap.parentName = idx;
        if (h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('tel')) colMap.parentPhone = idx;
        if (h.includes('email')) colMap.parentEmail = idx;
        if (h.includes('address') || h.includes('residence') || h.includes('location')) colMap.address = idx;
        if (h.includes('blood')) colMap.bloodGroup = idx;
      });
    }

    const baseSerial = Number(startSerialInput) || calculatedNextSerial;
    const rows: ParsedStudentRow[] = [];

    dataLines.forEach((line, lineIdx) => {
      const cells = parseLine(line);
      if (cells.length === 0 || cells.every(c => !c)) return;

      // Extract values with flexible column or positional fallback
      const rawName = (colMap.name !== undefined ? cells[colMap.name] : cells[0]) || '';
      const cleanName = rawName.replace(/^#?\d+[\.\-\)]\s*/, '').trim(); // Remove leading numbering like "1. John Doe"
      
      if (!cleanName) return;

      const rawGrade = (colMap.grade !== undefined ? cells[colMap.grade] : cells[2]) || 'Grade 1';
      const cleanGrade = rawGrade.trim() || 'Grade 1';
      
      const rawLevel = (colMap.level !== undefined ? cells[colMap.level] : cells[1]) || '';
      let cleanLevel: 'nursery' | 'primary' | 'secondary' = deduceLevel(cleanGrade);
      if (rawLevel.toLowerCase().includes('nursery')) cleanLevel = 'nursery';
      else if (rawLevel.toLowerCase().includes('secondary')) cleanLevel = 'secondary';
      else if (rawLevel.toLowerCase().includes('primary')) cleanLevel = 'primary';

      const rawSection = (colMap.section !== undefined ? cells[colMap.section] : cells[3]) || 'A';
      const cleanSection = (rawSection.trim() || 'A').toUpperCase();

      const rawBranch = (colMap.branch !== undefined ? cells[colMap.branch] : cells[4]) || '';
      let cleanBranch: 'GN' | 'RS' = defaultBranch;
      if (rawBranch.toUpperCase().includes('RS') || rawBranch.toLowerCase().includes('runjin')) cleanBranch = 'RS';
      else if (rawBranch.toUpperCase().includes('GN') || rawBranch.toLowerCase().includes('gawun')) cleanBranch = 'GN';

      const rawAdmissionNo = (colMap.enrollmentNo !== undefined ? cells[colMap.enrollmentNo] : cells[5]) || '';
      const cleanAdmissionNo = rawAdmissionNo.trim();
      const isCustom = preservePreviousPortalIds && cleanAdmissionNo.length > 0;

      const currentSerial = baseSerial + lineIdx;
      const classCode = getLiveClassCode(cleanGrade);
      const autoAdmissionNo = `${cleanBranch}${defaultSession}${classCode}${String(currentSerial).padStart(3, '0')}`;

      const rawGender = (colMap.gender !== undefined ? cells[colMap.gender] : cells[6]) || '';
      const gender: 'Male' | 'Female' = rawGender.toLowerCase().startsWith('f') || rawGender.toLowerCase().includes('girl') ? 'Female' : 'Male';

      const rawDob = (colMap.dob !== undefined ? cells[colMap.dob] : cells[7]) || '';
      const dob = rawDob.trim() || '2018-05-15';

      const rawParent = (colMap.parentName !== undefined ? cells[colMap.parentName] : cells[8]) || '';
      const parentName = rawParent.trim() || `Guardian of ${cleanName}`;

      const rawPhone = (colMap.parentPhone !== undefined ? cells[colMap.parentPhone] : cells[9]) || '';
      const parentPhone = rawPhone.trim() || "+234 " + Math.floor(8000000000 + Math.random() * 100000000);

      const rawEmail = (colMap.parentEmail !== undefined ? cells[colMap.parentEmail] : cells[10]) || '';
      const parentEmail = rawEmail.trim() || `parent.${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;

      const rawAddress = (colMap.address !== undefined ? cells[colMap.address] : cells[11]) || '';
      const address = rawAddress.trim() || (cleanBranch === 'GN' ? 'Gawun Nama Area, Kano Road, Sokoto' : 'opp. Sambo Primary School, Runjin Sambo, Sokoto');

      const rawBlood = (colMap.bloodGroup !== undefined ? cells[colMap.bloodGroup] : cells[12]) || 'O+';
      const bloodGroup = rawBlood.trim() || 'O+';

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!cleanName) errors.push('Student name is required');
      if (isCustom && existingStudents.some(s => s.enrollmentNo?.toLowerCase() === cleanAdmissionNo.toLowerCase())) {
        warnings.push(`Admission ID '${cleanAdmissionNo}' already exists in registry. Consider auto-generating.`);
      }

      rows.push({
        id: `parsed-${Date.now()}-${lineIdx}-${Math.floor(Math.random() * 1000)}`,
        selected: true,
        name: cleanName,
        level: cleanLevel,
        grade: cleanGrade,
        classSection: cleanSection,
        branch: cleanBranch,
        enrollmentNo: isCustom ? cleanAdmissionNo : undefined,
        isCustomAdmissionNo: isCustom,
        allocatedAdmissionNo: isCustom ? cleanAdmissionNo : autoAdmissionNo,
        serialNumber: currentSerial,
        gender,
        dob,
        parentName,
        parentPhone,
        parentEmail,
        address,
        bloodGroup,
        sessionYear: defaultSession,
        hasErrors: errors.length > 0,
        errors,
        warnings
      });
    });

    if (rows.length === 0) {
      alert("No valid student records could be extracted. Please check the file format.");
      return;
    }

    setParsedRows(rows);
    setStep(2);
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) parseRawTextToRows(text);
    };
    reader.readAsText(file);
  };

  // Handle Drag and Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) parseRawTextToRows(text);
    };
    reader.readAsText(file);
  };

  // Handle Row Selection Toggle
  const toggleRowSelection = (rowId: string) => {
    setParsedRows(prev => prev.map(r => r.id === rowId ? { ...r, selected: !r.selected } : r));
  };

  const toggleSelectAll = (checked: boolean) => {
    setParsedRows(prev => prev.map(r => ({ ...r, selected: checked })));
  };

  const handleDeleteRow = (rowId: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== rowId));
  };

  // Filtered rows for Step 2 preview
  const filteredRows = useMemo(() => {
    return parsedRows.filter(r => {
      const matchesSearch = searchQuery === '' || 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.allocatedAdmissionNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.grade.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = gradeFilter === 'All' || r.grade === gradeFilter;
      const matchesBranch = branchFilter === 'All' || r.branch === branchFilter;
      return matchesSearch && matchesGrade && matchesBranch;
    });
  }, [parsedRows, searchQuery, gradeFilter, branchFilter]);

  const selectedCount = parsedRows.filter(r => r.selected).length;
  const gnCount = parsedRows.filter(r => r.selected && r.branch === 'GN').length;
  const rsCount = parsedRows.filter(r => r.selected && r.branch === 'RS').length;
  const customIdCount = parsedRows.filter(r => r.selected && r.isCustomAdmissionNo).length;

  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    parsedRows.forEach(r => set.add(r.grade));
    return Array.from(set);
  }, [parsedRows]);

  // Execute Permanent Import
  const handleExecutePermanentImport = async () => {
    const selectedRows = parsedRows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      alert("Please select at least one student to import.");
      return;
    }

    setIsImporting(true);
    setImportProgress(10);
    setImportError(null);

    const payload = selectedRows.map((r, idx) => ({
      name: r.name,
      level: r.level,
      grade: r.grade,
      classSection: r.classSection,
      branch: r.branch,
      enrollmentNo: r.isCustomAdmissionNo ? r.enrollmentNo : r.allocatedAdmissionNo,
      serialNumber: r.serialNumber,
      sessionYear: r.sessionYear,
      parentName: r.parentName,
      parentEmail: r.parentEmail,
      parentPhone: r.parentPhone,
      behaviorRating: 'Good' as const,
      gender: r.gender,
      dob: r.dob,
      address: r.address,
      bloodGroup: r.bloodGroup
    }));

    try {
      setImportProgress(40);
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: payload })
      });

      setImportProgress(85);

      if (res.ok) {
        const data = await res.json();
        const createdList = data.students || [];
        setImportedResults(createdList);
        setImportProgress(100);
        setIsImporting(false);
        setStep(4);
        onImportComplete(createdList);
      } else {
        // Fallback to sequential creation if bulk fails
        const fallbackCreated: Student[] = [];
        for (let i = 0; i < payload.length; i++) {
          try {
            const singleRes = await fetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload[i])
            });
            if (singleRes.ok) {
              const singleData = await singleRes.json();
              fallbackCreated.push(singleData);
            }
          } catch (err) {
            console.error('Fallback error for item', i, err);
          }
          setImportProgress(40 + Math.round(((i + 1) / payload.length) * 55));
        }

        if (fallbackCreated.length > 0) {
          setImportedResults(fallbackCreated);
          setImportProgress(100);
          setIsImporting(false);
          setStep(4);
          onImportComplete(fallbackCreated);
        } else {
          throw new Error('Server returned an error while writing student records.');
        }
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setIsImporting(false);
      setImportError(err.message || 'Failed to complete permanent import. Please check network connectivity.');
    }
  };

  const resetAll = () => {
    setStep(1);
    setParsedRows([]);
    setRawPastedText('');
    setUploadedFileName('');
    setImportedResults([]);
    setImportError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        id="student-bulk-import-modal-container"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        {/* HEADER BAR */}
        <div className="bg-linear-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Student Registry Hub
                </span>
                <span className="text-[11px] text-emerald-200/80 font-mono">
                  Stage {step} of {step === 4 ? '4 (Done)' : '3'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {step === 1 && 'Upload & Onboard Students (Previous Portal / CSV)'}
                {step === 2 && 'Pre-Import Verification & Review Table'}
                {step === 3 && 'Final Confirmation Before Permanent Registration'}
                {step === 4 && 'Student Onboarding Complete!'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="hidden sm:flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 transition-all cursor-pointer"
              title="Download clean CSV template for filling student records"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>

            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP PROGRESS TRACKER */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-2.5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-slate-500">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
            <div className={`flex items-center space-x-1.5 ${step === 1 ? 'text-emerald-700 dark:text-emerald-400' : step > 1 ? 'text-slate-700 dark:text-slate-300' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 1 ? 'bg-emerald-600 text-white' : step > 1 ? 'bg-slate-300 text-slate-800' : 'bg-slate-200'}`}>1</span>
              <span>1. Download & Upload</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className={`flex items-center space-x-1.5 ${step === 2 ? 'text-emerald-700 dark:text-emerald-400' : step > 2 ? 'text-slate-700 dark:text-slate-300' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 2 ? 'bg-emerald-600 text-white' : step > 2 ? 'bg-slate-300 text-slate-800' : 'bg-slate-200'}`}>2</span>
              <span>2. Review & Verify</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className={`flex items-center space-x-1.5 ${step === 3 ? 'text-emerald-700 dark:text-emerald-400' : step > 3 ? 'text-slate-700 dark:text-slate-300' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>3</span>
              <span>3. Confirm Import</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-[11px] text-slate-500">
            <span className="font-semibold">Next Serial:</span>
            <span className="font-mono font-bold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-200">
              #{calculatedNextSerial}
            </span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
          
          {/* STEP 1: UPLOAD & TEMPLATE DOWNLOAD */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              {/* Top Banner: Explanation and Template Download CTA */}
              <div className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Student Onboarding Template & Previous Portal Migration
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed max-w-2xl">
                    Download the standardized template below. Fill in student records from your previous portal or school registers. Once uploaded, you will have a chance to review, verify admission numbers, and confirm before anything is permanently written to the database.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSpecGuide(prev => !prev)}
                    className="bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer hover:bg-emerald-50"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showSpecGuide ? 'Hide Columns Guide' : 'View Columns Guide'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Column Guide */}
              {showSpecGuide && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                      Template Column Field Specifications
                    </span>
                    <span className="text-[10px] text-slate-400">All column headers are case-insensitive</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-sans">
                    <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-150 dark:border-slate-800">
                      <b className="text-emerald-700 dark:text-emerald-400">Full Name *</b>
                      <p className="text-[11px] text-slate-500">Student full legal name (e.g. Muhammad Aminu Bello)</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-150 dark:border-slate-800">
                      <b className="text-emerald-700 dark:text-emerald-400">Level & Grade</b>
                      <p className="text-[11px] text-slate-500">e.g. Nursery (K1), Primary (Grade 1-6), Secondary (Grade 9)</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-150 dark:border-slate-800">
                      <b className="text-emerald-700 dark:text-emerald-400">Branch (GN / RS)</b>
                      <p className="text-[11px] text-slate-500">Gawun Nama (GN) or Runjin Sambo (RS)</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-150 dark:border-slate-800">
                      <b className="text-indigo-700 dark:text-indigo-400">Admission Number</b>
                      <p className="text-[11px] text-slate-500">Optional: Enter previous portal ID to preserve it, or leave blank to auto-generate</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-150 dark:border-slate-800">
                      <b className="text-slate-700 dark:text-slate-300">Class Section</b>
                      <p className="text-[11px] text-slate-500">Class arm (e.g. A, B, Gold, Diamond)</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-150 dark:border-slate-800">
                      <b className="text-slate-700 dark:text-slate-300">Parent & Contact</b>
                      <p className="text-[11px] text-slate-500">Parent Name, Phone number (+234...), Email, Address</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Default Settings & Admission Rules */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Default Intake Settings & Admission Parameters
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500">Default Target Campus</label>
                    <select
                      value={defaultBranch}
                      onChange={(e) => setDefaultBranch(e.target.value as 'GN' | 'RS')}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="GN">Gawun Nama Campus (GN)</option>
                      <option value="RS">Runjin Sambo Campus (RS)</option>
                    </select>
                    <span className="text-[10px] text-slate-400">Used when branch column is blank</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500">Admission Session Code</label>
                    <select
                      value={defaultSession}
                      onChange={(e) => setDefaultSession(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="26">2026-2027 Session (Code 26)</option>
                      <option value="25">2025-2026 Session (Code 25)</option>
                      <option value="24">2024-2025 Session (Code 24)</option>
                      <option value="23">2023-2024 Session (Code 23)</option>
                      <option value="22">2022-2023 Session (Code 22)</option>
                    </select>
                    <span className="text-[10px] text-slate-400">Embedded in new admission IDs</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500">Starting Serial Number</label>
                    <input
                      type="number"
                      placeholder={`Auto: ${calculatedNextSerial}`}
                      value={startSerialInput}
                      onChange={(e) => setStartSerialInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400">Next auto-assigned register number</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preservePreviousPortalIds}
                      onChange={(e) => setPreservePreviousPortalIds(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Preserve Previous Portal Admission IDs when supplied in file
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    If unchecked, fresh SAMS codes (e.g. GN2604001) are always generated.
                  </span>
                </div>
              </div>

              {/* Upload or Paste Tab Switcher */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      inputMode === 'upload'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload CSV / Excel File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode('paste')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      inputMode === 'paste'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    <span>Paste Spreadsheet Rows (Direct Copy)</span>
                  </button>
                </div>

                {/* Tab A: Dropzone Upload */}
                {inputMode === 'upload' && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                      isDragging 
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv, .tsv, .txt"
                      className="hidden"
                    />

                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                      <UploadCloud className="w-7 h-7" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Drag & drop your filled student template here'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Supports CSV (.csv), Tab-separated (.tsv), or exported spreadsheet text files.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      Browse Device Files
                    </button>
                  </div>
                )}

                {/* Tab B: Paste Textarea */}
                {inputMode === 'paste' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Copy rows from Excel or Google Sheets (including headers) and paste below:
                    </p>
                    <textarea
                      rows={6}
                      value={rawPastedText}
                      onChange={(e) => setRawPastedText(e.target.value)}
                      placeholder={`Full Name\tGrade\tBranch\tAdmission Number\nAbubakar Bello\tGrade 1\tGN\tGN2004001\nZaynab Umar\tGrade 3\tRS\t\nBashir Ibrahim\tK1 (Ages 3-4)\tGN\t`}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 h-44"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!rawPastedText.trim()}
                        onClick={() => parseRawTextToRows(rawPastedText)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        Parse & Review Pasted Rows
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW, VALIDATE & PRE-IMPORT TABLE */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary KPIs & Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Extracted</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{parsedRows.length}</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block">Selected for Import</span>
                  <span className="text-lg font-black text-emerald-800 dark:text-emerald-300">{selectedCount}</span>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400 block">Gawun Nama (GN)</span>
                  <span className="text-lg font-black text-indigo-800 dark:text-indigo-300">{gnCount}</span>
                </div>
                <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-teal-700 dark:text-teal-400 block">Runjin Sambo (RS)</span>
                  <span className="text-lg font-black text-teal-800 dark:text-teal-300">{rsCount}</span>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 block">Previous Portal IDs</span>
                  <span className="text-lg font-black text-amber-800 dark:text-amber-300">{customIdCount}</span>
                </div>
              </div>

              {/* Table Controls (Search & Filters) */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search preview rows..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>

                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="All">All Grades ({parsedRows.length})</option>
                    {availableGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>

                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="All">All Campuses</option>
                    <option value="GN">Gawun Nama (GN)</option>
                    <option value="RS">Runjin Sambo (RS)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline px-2 py-1"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="text-[11px] font-bold text-slate-500 hover:underline px-2 py-1"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Review Data Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 z-10 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCount === parsedRows.length && parsedRows.length > 0}
                            onChange={(e) => toggleSelectAll(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                        </th>
                        <th className="p-3">#</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class & Wing</th>
                        <th className="p-3">Campus</th>
                        <th className="p-3">Admission ID</th>
                        <th className="p-3">Parent & Contact</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
                      {filteredRows.map((row, idx) => (
                        <tr 
                          key={row.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors ${
                            !row.selected ? 'opacity-40 bg-slate-50/40' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => toggleRowSelection(row.id)}
                              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center space-x-1.5">
                              <span>{row.name}</span>
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.2 rounded font-mono">
                                {row.gender}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {row.grade} ({row.classSection})
                              </span>
                              <span className="text-[10px] text-slate-400 capitalize">
                                {row.level} wing
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              row.branch === 'RS'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              {row.branch === 'RS' ? 'Runjin Sambo' : 'Gawun Nama'} ({row.branch})
                            </span>
                          </td>
                          <td className="p-3">
                            {row.isCustomAdmissionNo ? (
                              <div className="flex items-center space-x-1">
                                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold px-2 py-0.5 rounded text-[11px] border border-amber-300 dark:border-amber-800">
                                  {row.enrollmentNo}
                                </span>
                                <span className="text-[9px] text-amber-600 font-semibold">(Previous Portal)</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold px-2 py-0.5 rounded text-[11px] border border-emerald-300 dark:border-emerald-800">
                                  {row.allocatedAdmissionNo}
                                </span>
                                <span className="text-[9px] text-emerald-600 font-semibold">(Auto-Gen)</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-[11px]">
                            <div className="text-slate-700 dark:text-slate-300 font-medium">{row.parentName}</div>
                            <div className="text-slate-400 font-mono text-[10px]">{row.parentPhone}</div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Remove row from import list"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFICATION & CONFIRMATION DIALOGUE */}
          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto py-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-500 p-6 shadow-xl space-y-5 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Confirm Permanent Student Registration
                  </h3>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto">
                    You are about to permanently import and register <b className="text-emerald-600 font-bold">{selectedCount} student profiles</b> into the institutional database. Each student will receive an active academic ledger, attendance directory, and grade book record.
                  </p>
                </div>

                {/* Import Breakdown Checklist */}
                <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-4 text-left text-xs space-y-2.5 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Total Enrolled Records:</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{selectedCount} Students</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Gawun Nama Campus Allocation:</span>
                    <span className="font-bold text-indigo-600 font-mono">{gnCount} Students</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Runjin Sambo Campus Allocation:</span>
                    <span className="font-bold text-teal-600 font-mono">{rsCount} Students</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Preserved Previous Portal IDs:</span>
                    <span className="font-bold text-amber-600 font-mono">{customIdCount} Records</span>
                  </div>
                </div>

                {importError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{importError}</span>
                  </div>
                )}

                {isImporting && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <span>Writing to Student Ledger & Registry...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS SUMMARY SCREEN */}
          {step === 4 && (
            <div className="space-y-6 max-w-2xl mx-auto py-4 text-center animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-8 shadow-xl space-y-5">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Batch Import Successfully Registered!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    <b className="text-emerald-700 dark:text-emerald-400 font-bold">{importedResults.length} students</b> have been successfully allocated and stored in the active SAMS institutional database.
                  </p>
                </div>

                {/* Sample of registered students */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto text-left text-xs divide-y divide-slate-200/50">
                  {importedResults.slice(0, 8).map((st, i) => (
                    <div key={st.id || i} className="py-1.5 flex justify-between items-center pr-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{st.name}</span>
                      <span className="text-[10px] text-slate-400">{st.grade} • {st.branch}</span>
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                        {st.enrollmentNo}
                      </span>
                    </div>
                  ))}
                  {importedResults.length > 8 && (
                    <div className="py-1.5 text-center text-[10px] text-slate-400 italic">
                      + {importedResults.length - 8} more students registered
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    View Enrolled Student Directory
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Import Another Batch
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER BUTTONS */}
        {step !== 4 && (
          <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => setStep(prev => (prev - 1) as any)}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {step === 2 && (
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={() => setStep(3)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>Proceed to Confirmation ({selectedCount})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  disabled={isImporting || selectedCount === 0}
                  onClick={handleExecutePermanentImport}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? (
                    <span>Registering Students...</span>
                  ) : (
                    <span>Confirm & Permanently Import ({selectedCount})</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default StudentBulkImportModal;
