#!/usr/bin/env node

/**
 * GreenChainz Deployment Diagnostic Script
 * Checks for common issues preventing updates from appearing on deployed site
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = '/home/runner/work/green-sourcing-b2b-app/green-sourcing-b2b-app';
const FRONTEND_DIR = path.join(REPO_ROOT, 'frontend');

console.log('🔍 GreenChainz Deployment Diagnostic Tool\n');
console.log('=' .repeat(60));

const issues = [];
const warnings = [];
const passed = [];

// Helper functions
function checkFileExists(filepath, description) {
  if (fs.existsSync(filepath)) {
    passed.push(`✅ ${description}`);
    return true;
  } else {
    issues.push(`❌ ${description} - File not found: ${filepath}`);
    return false;
  }
}

function checkCommand(cmd, description) {
  try {
    execSync(cmd, { cwd: REPO_ROOT, stdio: 'pipe' });
    passed.push(`✅ ${description}`);
    return true;
  } catch (error) {
    issues.push(`❌ ${description} - ${error.message}`);
    return false;
  }
}

// 1. Check Git Status
console.log('\n📦 Git Repository Status:');
try {
  const gitStatus = execSync('git status --porcelain', { cwd: REPO_ROOT }).toString();
  if (gitStatus.trim() === '') {
    passed.push('✅ No uncommitted changes');
  } else {
    warnings.push(`⚠️  Uncommitted changes detected:\n${gitStatus}`);
  }
} catch (error) {
  issues.push(`❌ Git status check failed: ${error.message}`);
}

// 2. Check Frontend Configuration Files
console.log('\n⚙️  Configuration Files:');
checkFileExists(path.join(FRONTEND_DIR, 'package.json'), 'package.json exists');
checkFileExists(path.join(FRONTEND_DIR, 'vite.config.js'), 'vite.config.js or vite.config.ts exists') ||
  checkFileExists(path.join(FRONTEND_DIR, 'vite.config.ts'), 'vite.config.ts exists');
checkFileExists(path.join(FRONTEND_DIR, 'vercel.json'), 'vercel.json exists (for SPA routing)');
checkFileExists(path.join(FRONTEND_DIR, '.env.example'), '.env.example exists');

// 3. Check Logo Assets
console.log('\n🎨 Logo Assets:');
const logoDir = path.join(FRONTEND_DIR, 'public/assets/logo');
const brandDir = path.join(FRONTEND_DIR, 'public/brand');

checkFileExists(path.join(logoDir, 'greenchainz-full.svg'), 'Main logo SVG');
checkFileExists(path.join(brandDir, 'greenchainz-logo.png'), 'PNG logo fallback');

// 4. Check for Build Artifacts in Git
console.log('\n🗑️  Build Artifacts:');
const distDir = path.join(FRONTEND_DIR, 'dist');
const nodeModulesDir = path.join(FRONTEND_DIR, 'node_modules');

if (fs.existsSync(distDir)) {
  try {
    const gitCheck = execSync(`git check-ignore ${distDir}`, { cwd: REPO_ROOT }).toString();
    if (gitCheck.includes('dist')) {
      passed.push('✅ dist/ is properly ignored by git');
    } else {
      warnings.push('⚠️  dist/ directory exists but may not be properly ignored');
    }
  } catch {
    warnings.push('⚠️  dist/ directory exists - ensure it\'s in .gitignore');
  }
}

// 5. Check TypeScript Types
console.log('\n📝 TypeScript Type Issues:');
const typesFile = path.join(FRONTEND_DIR, 'src/types.ts');
const productDataFile = path.join(FRONTEND_DIR, 'src/mocks/productData.ts');

if (fs.existsSync(typesFile) && fs.existsSync(productDataFile)) {
  const typesContent = fs.readFileSync(typesFile, 'utf8');
  const productDataContent = fs.readFileSync(productDataFile, 'utf8');
  
  // Check for duplicate Product interfaces
  const typesHasProduct = typesContent.includes('export interface Product');
  const mockHasProduct = productDataContent.includes('export interface Product');
  
  if (typesHasProduct && mockHasProduct) {
    warnings.push('⚠️  Duplicate Product interface found in types.ts and mocks/productData.ts');
  } else {
    passed.push('✅ No duplicate Product interface');
  }
}

// 6. Check Build Process
console.log('\n🏗️  Build Check:');
try {
  console.log('   Running npm run build...');
  const buildOutput = execSync('npm run build', { 
    cwd: FRONTEND_DIR, 
    stdio: 'pipe',
    timeout: 60000 
  }).toString();
  
  if (buildOutput.includes('built in')) {
    passed.push('✅ Build completed successfully');
    
    // Check dist output
    if (fs.existsSync(path.join(distDir, 'index.html'))) {
      passed.push('✅ dist/index.html generated');
    } else {
      issues.push('❌ dist/index.html not found after build');
    }
    
    // Check for assets
    const assetsDir = path.join(distDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const assets = fs.readdirSync(assetsDir);
      passed.push(`✅ ${assets.length} asset files generated`);
    }
  }
} catch (error) {
  issues.push(`❌ Build failed: ${error.message}`);
}

// 7. Check for 404 Asset References
console.log('\n🔗 Asset Path Verification:');
const indexHtml = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtml)) {
  const htmlContent = fs.readFileSync(indexHtml, 'utf8');
  
  // Check for logo references
  if (htmlContent.includes('/assets/logo/') || htmlContent.includes('/brand/')) {
    passed.push('✅ Logo paths found in built HTML');
  } else {
    warnings.push('⚠️  No logo asset paths found in built HTML');
  }
}

// 8. Check Environment Variables
console.log('\n🔐 Environment Configuration:');
const envExample = path.join(FRONTEND_DIR, '.env.example');
const envLocal = path.join(FRONTEND_DIR, '.env.local');

if (fs.existsSync(envExample)) {
  const envContent = fs.readFileSync(envExample, 'utf8');
  if (envContent.includes('VITE_SUPABASE_URL')) {
    passed.push('✅ .env.example has VITE_SUPABASE_URL');
  }
  if (envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    passed.push('✅ .env.example has VITE_SUPABASE_ANON_KEY');
  }
}

if (!fs.existsSync(envLocal)) {
  warnings.push('⚠️  .env.local not found - Supabase connection may fail locally');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 DIAGNOSTIC SUMMARY:\n');

if (passed.length > 0) {
  console.log('✅ PASSED CHECKS:');
  passed.forEach(p => console.log(`   ${p}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(w => console.log(`   ${w}`));
}

if (issues.length > 0) {
  console.log('\n❌ CRITICAL ISSUES:');
  issues.forEach(i => console.log(`   ${i}`));
}

console.log('\n' + '='.repeat(60));

// Exit code
if (issues.length > 0) {
  console.log('\n🚨 Action Required: Fix critical issues above');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Review warnings - may impact deployment');
  process.exit(0);
} else {
  console.log('\n✨ All checks passed! Ready for deployment');
  process.exit(0);
}
