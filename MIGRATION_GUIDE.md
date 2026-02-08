# Adding New Pages - Migration Guide

This guide explains how to add new pages to AgriProfit V1 while maintaining UI/UX consistency.

---

## For New Protected Pages (With Sidebar)

### Step 1: Create the Page File

Create your page at `frontend/src/app/[page-name]/page.tsx`:

```tsx
"use client"

import { useState, useEffect } from "react"
// Import your page-specific icons
import { YourIcon } from "lucide-react"
// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// IMPORTANT: Import layout components
import { Sidebar } from "@/components/layout/Sidebar"
import { Navbar } from "@/components/layout/Navbar"

export default function MyNewPage() {
    // Your state and logic here
    
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {/* Your page content */}
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">
                                Page Title
                            </h1>
                            <p className="text-muted-foreground">
                                Page description
                            </p>
                        </div>
                        
                        {/* Content */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Section Title</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Your content here */}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
```

### Step 2: Add to Navigation

If your page should appear in the sidebar, update **both** components:

#### Update Sidebar.tsx

File: `frontend/src/components/layout/Sidebar.tsx`

```tsx
// 1. Add your icon to imports
import {
    // ... existing icons
    YourIcon,  // Add your icon
} from "lucide-react"

// 2. Add to menuItems array
const menuItems = [
    // ... existing items
    { icon: YourIcon, label: "Your Page", href: "/your-page" },
]
```

#### Update Navbar.tsx

File: `frontend/src/components/layout/Navbar.tsx`

```tsx
// 1. Add your icon to imports
import {
    // ... existing icons
    YourIcon,  // Add your icon
} from "lucide-react"

// 2. Add to mobileMenuItems array
const mobileMenuItems = [
    // ... existing items
    { icon: YourIcon, label: "Your Page", href: "/your-page" },
]
```

#### Update Dashboard's Inline Menu

File: `frontend/src/app/dashboard/page.tsx`

```tsx
// Add to menuItems array
const menuItems = [
    // ... existing items
    { icon: <YourIcon className="h-5 w-5" />, label: "Your Page", href: "/your-page", badge: null },
]
```

---

## For New Public Pages (No Sidebar)

For pages like login, register, forgot-password that should NOT have navigation:

```tsx
"use client"

export default function PublicPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Your content - no Sidebar/Navbar */}
            <div className="container mx-auto px-4 py-8">
                {/* Page content */}
            </div>
        </div>
    )
}
```

---

## Standard Page Patterns

### Page with Cards Grid

```tsx
<main className="flex-1 p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Title</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>...</Card>
            <Card>...</Card>
            <Card>...</Card>
        </div>
    </div>
</main>
```

### Page with Table

```tsx
<main className="flex-1 p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Title</h1>
            <Button>Add New</Button>
        </div>
        
        <Card>
            <Table>
                <TableHeader>...</TableHeader>
                <TableBody>...</TableBody>
            </Table>
        </Card>
    </div>
</main>
```

### Page with Form

```tsx
<main className="flex-1 p-4 sm:p-6 lg:p-8">
    <div className="max-w-2xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>Form Title</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    {/* Form fields */}
                </form>
            </CardContent>
        </Card>
    </div>
</main>
```

---

## Checklist for New Pages

- [ ] Page uses `flex min-h-screen bg-background` wrapper
- [ ] Page imports and renders `<Sidebar />`
- [ ] Page imports and renders `<Navbar />`
- [ ] Content is wrapped in `<main className="flex-1">`
- [ ] Spacing is consistent (p-4 sm:p-6 lg:p-8)
- [ ] Max width is set (max-w-7xl mx-auto)
- [ ] Heading uses text-3xl font-bold
- [ ] If in navigation, added to Sidebar.tsx, Navbar.tsx, and dashboard menuItems
- [ ] Mobile responsive tested
- [ ] No TypeScript errors
