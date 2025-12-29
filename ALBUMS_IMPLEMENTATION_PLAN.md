# Albums / Workbook Feature Implementation Plan

## 1. Overview
We are building a **Workbook-style Learning Management System (LMS)** within the existing engagement platform. 
- **Designers** create "Master Albums" (templates) containing mixed media and questions.
- **Trainers** assign these Albums to Classes.
- **Learners** complete them at their own pace (or guided).
- **Trainers** track progress and view answers.

## 2. Core Concepts
- **Album**: A collection of pages.
- **Page**: A single scrollable view containing multiple "Blocks".
- **Block**: The atomic unit of content. Types:
    - `Text` (Rich text, headers, paragraphs)
    - `Image` / `Video` (Media)
    - `Question` (Input fields: Multiple Choice, Short Answer, Essay) -> *New functionality*
- **Assignment**: The link between a Class and an Album.

## 3. Database Schema (Firestore)

### Collection: `album_templates` (The "Master" Copies)
Created by Designers. Read-only for Trainers.
```typescript
interface AlbumTemplate {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  designerId: string; // User ID of the creator
  isPublished: boolean; // If true, visible to Trainers in the library
  createdAt: number;
  updatedAt: number;
  
  // Content Structure
  pages: {
    id: string;
    title: string;
    blocks: AlbumBlock[]; // Ordered list of content blocks
  }[];
}

type AlbumBlock = 
  | { type: 'text', content: string } // Markdown or HTML
  | { type: 'media', url: string, mediaType: 'image' | 'video' }
  | { type: 'question', questionId: string, points: number } // Reference to existing or new question structure
  | { type: 'link', targetAlbumId: string, label: string }; // For linking to other albums
```

### Collection: `class_albums` (The "Assignments")
Created when a Trainer assigns a template to a class.
```typescript
interface ClassAlbum {
  id: string;
  templateId: string; // Reference to original
  classId: string;
  assignedByUserId: string;
  assignedAt: number;
  dueDate?: number;
  status: 'active' | 'archived';
  settings: {
    allowLateSubmissions: boolean;
    isGuided: boolean; // If true, Trainer controls the active page
  };
}
```

### Collection: `album_progress` (Student Work)
Tracks individual student performance.
```typescript
interface AlbumProgress {
  id: string;
  classAlbumId: string;
  studentId: string;
  
  // Progress tracking
  completedPages: string[]; // IDs of pages marked as "Done"
  currentStep: string; // ID of the last viewed page
  percentComplete: number; // 0-100
  
  // Answers
  answers: {
    [questionBlockId: string]: {
      answer: string | number | string[]; // The student's input
      submittedAt: number;
      needsGrading: boolean; // For open-ended text
      score?: number; // If graded
      feedback?: string; // Trainer comments
    }
  };
}
```

## 4. Feature Workflows

### Phase 1: Designer - Album Creator
- **Route**: `/host/design/albums/create`
- **UI**: A block-based editor (Notion-style simplified).
    - "Add Page"
    - "Add Block" (Text, Image, Question)
    - Preview Mode.
- **Action**: Save to `album_templates`.

### Phase 2: Trainer - Library & Assignment
- **Route**: `/host/library`
- **UI**: Grid of published Albums.
- **Action**: "Assign to Class" modal -> Creates `class_albums` doc.

### Phase 3: Learner - Workbook View
- **Route**: `/student/class/[classId]/album/[albumId]`
- **UI**: Clean, focus-mode reader. 
    - Sidebar navigation (Table of Contents).
    - Main content area with interactive inputs.
    - "Save" and "Submit Page" buttons.

### Phase 4: Trainer - Gradebook
- **Route**: `/host/class/[classId]/grades`
- **UI**: Matrix view.
    - Rows: Students
    - Columns: Albums / Questions
    - Cells: Status / Score / Link to detailed view.
- **Detail View**: See a specific student's filled-out workbook and add comments/grades.

## 5. Addressing "Nesting"
We will use a **Flat Structure with Links**.
- **Reason**: Deeply nested folders (Album -> Folder -> Sub-Folder -> Page) complicate the UI for both creators and learners (too many clicks, complex navigation state).
- **Solution**: "Album Linking". You can create a "Master Album" that acts as a Table of Contents, just containing Links to "Chapter 1 Album", "Chapter 2 Album". This achieves the same organizational power without rigid hierarchy code.

## 6. Synchronous Mode
- We can reuse the `Class` "Current Activity" concept.
- If `class.currentActivity` is set to `{ type: 'album', id: 'album_xyz', pageId: 'page_1' }`, the student's view effectively locks or highlights that specific page.

