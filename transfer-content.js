import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file directory with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source and destination paths
const sourcePosts = path.join(__dirname, '..', 'content', 'posts');
const sourceDrafts = path.join(__dirname, '..', 'content', 'drafts');
const destPosts = path.join(__dirname, 'src', 'content', 'blog');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destPosts)) {
  fs.mkdirSync(destPosts, { recursive: true });
}

// Function to process and copy a post
function processPost(sourcePath, destPath, isDraft = false) {
  try {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    
    // Parse the front matter
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontMatterMatch) {
      console.log(`Skipping ${sourcePath}: No front matter found`);
      return;
    }
    
    const [_, frontMatter, postContent] = frontMatterMatch;
    
    // Extract date and title
    const dateMatch = frontMatter.match(/date:\s*"?([^"\n]+)"?/);
    const titleMatch = frontMatter.match(/title:\s*(.+)$/m);
    const categoriesMatch = frontMatter.match(/categories:\n([\s\S]*?)(\n\w|$)/);
    
    if (!dateMatch || !titleMatch) {
      console.log(`Skipping ${sourcePath}: Missing date or title`);
      return;
    }
    
    const date = dateMatch[1].trim();
    const title = titleMatch[1].trim();
    
    // Extract categories if present
    let categories = [];
    if (categoriesMatch) {
      categories = categoriesMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('- '))
        .map(line => line.replace('- ', '').trim())
        .filter(Boolean);
    }
    
    // Create the new front matter
    let newFrontMatter = `---
title: ${title}
description: ""
pubDate: ${date}
`;

    if (categories.length > 0) {
      newFrontMatter += `tags: [${categories.map(c => `"${c}"`).join(', ')}]
`;
    }
    
    if (isDraft) {
      newFrontMatter += `draft: true
`;
    }
    
    newFrontMatter += `---

`;
    
    // Create the new content
    const newContent = newFrontMatter + postContent;
    
    // Extract the file name without extension
    const fileName = path.basename(sourcePath, path.extname(sourcePath));
    
    // Parse the date from the filename if it exists
    let fileDate = '';
    const filenameDateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
    
    if (filenameDateMatch) {
      fileDate = filenameDateMatch[1];
      const slug = filenameDateMatch[2];
      
      // Write the new file
      fs.writeFileSync(path.join(destPath, `${fileName}.md`), newContent);
      console.log(`Processed: ${fileName}`);
    } else {
      // No date in filename, just copy with original name
      fs.writeFileSync(path.join(destPath, `${fileName}.md`), newContent);
      console.log(`Processed: ${fileName} (no date in filename)`);
    }
    
  } catch (error) {
    console.error(`Error processing ${sourcePath}:`, error);
  }
}

// Process all published posts
console.log("Processing published posts...");
const publishedPosts = fs.readdirSync(sourcePosts);
publishedPosts.forEach(file => {
  if (file.endsWith('.md') || file.endsWith('.markdown') || file.endsWith('.mdx')) {
    processPost(path.join(sourcePosts, file), destPosts);
  }
});

// Process drafts
console.log("\nProcessing drafts...");
const drafts = fs.readdirSync(sourceDrafts);
drafts.forEach(file => {
  if (file.endsWith('.md') || file.endsWith('.markdown') || file.endsWith('.mdx')) {
    processPost(path.join(sourceDrafts, file), destPosts, true);
  }
});

console.log("\nContent transfer completed!");