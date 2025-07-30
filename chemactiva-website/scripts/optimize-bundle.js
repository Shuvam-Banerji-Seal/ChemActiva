#!/usr/bin/env node
// scripts/optimize-bundle.js
// Bundle optimization script for product page components

const fs = require('fs');
const path = require('path');

class BundleOptimizer {
    constructor() {
        this.srcDir = path.join(__dirname, '..', 'src');
        this.cssDir = path.join(this.srcDir, 'css');
        this.jsDir = path.join(this.srcDir, 'js');
        this.usedClasses = new Set();
        this.usedFunctions = new Set();
        this.unusedFiles = [];
        this.optimizationReport = {
            cssOptimization: {},
            jsOptimization: {},
            bundleSize: {},
            recommendations: []
        };
    }

    async optimize() {
        console.log('🚀 Starting bundle optimization...');
        
        try {
            // Analyze HTML files for used CSS classes
            await this.analyzeCSSUsage();
            
            // Analyze JavaScript dependencies
            await this.analyzeJSUsage();
            
            // Optimize CSS files
            await this.optimizeCSS();
            
            // Optimize JavaScript files
            await this.optimizeJS();
            
            // Generate optimization report
            await this.generateReport();
            
            console.log('✅ Bundle optimization completed successfully!');
            
        } catch (error) {
            console.error('❌ Bundle optimization failed:', error);
            process.exit(1);
        }
    }

    async analyzeCSSUsage() {
        console.log('📊 Analyzing CSS usage...');
        
        // Find all HTML files
        const htmlFiles = this.findFiles('.', '.html');
        
        // Extract used CSS classes from HTML files
        for (const htmlFile of htmlFiles) {
            const content = fs.readFileSync(htmlFile, 'utf8');
            const classMatches = content.match(/class=["']([^"']+)["']/g);
            
            if (classMatches) {
                classMatches.forEach(match => {
                    const classes = match.replace(/class=["']/, '').replace(/["']/, '').split(/\s+/);
                    classes.forEach(cls => {
                        if (cls.trim()) {
                            this.usedClasses.add(cls.trim());
                        }
                    });
                });
            }
        }
        
        // Also check JavaScript files for dynamically added classes
        const jsFiles = this.findFiles(this.jsDir, '.js');
        for (const jsFile of jsFiles) {
            const content = fs.readFileSync(jsFile, 'utf8');
            
            // Look for classList.add, className assignments, etc.
            const classPatterns = [
                /classList\.add\(['"`]([^'"`]+)['"`]\)/g,
                /className\s*=\s*['"`]([^'"`]+)['"`]/g,
                /setAttribute\(['"`]class['"`],\s*['"`]([^'"`]+)['"`]\)/g
            ];
            
            classPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const classes = match[1].split(/\s+/);
                    classes.forEach(cls => {
                        if (cls.trim()) {
                            this.usedClasses.add(cls.trim());
                        }
                    });
                }
            });
        }
        
        console.log(`📋 Found ${this.usedClasses.size} used CSS classes`);
    }

    async analyzeJSUsage() {
        console.log('📊 Analyzing JavaScript usage...');
        
        // Find all JavaScript files
        const jsFiles = this.findFiles(this.jsDir, '.js');
        const importGraph = new Map();
        
        // Build import dependency graph
        for (const jsFile of jsFiles) {
            const content = fs.readFileSync(jsFile, 'utf8');
            const imports = this.extractImports(content);
            const exports = this.extractExports(content);
            
            importGraph.set(jsFile, {
                imports: imports,
                exports: exports,
                size: content.length
            });
        }
        
        // Find entry points (files that are imported by HTML)
        const entryPoints = this.findEntryPoints();
        
        // Trace used modules from entry points
        const usedModules = this.traceUsedModules(importGraph, entryPoints);
        
        // Identify unused modules
        const allModules = Array.from(importGraph.keys());
        const unusedModules = allModules.filter(module => !usedModules.has(module));
        
        this.optimizationReport.jsOptimization = {
            totalModules: allModules.length,
            usedModules: usedModules.size,
            unusedModules: unusedModules.length,
            unusedFiles: unusedModules
        };
        
        console.log(`📋 JavaScript analysis: ${usedModules.size}/${allModules.length} modules used`);
    }

    async optimizeCSS() {
        console.log('🎨 Optimizing CSS files...');
        
        const cssFiles = this.findFiles(this.cssDir, '.css');
        let totalOriginalSize = 0;
        let totalOptimizedSize = 0;
        
        for (const cssFile of cssFiles) {
            const content = fs.readFileSync(cssFile, 'utf8');
            totalOriginalSize += content.length;
            
            // Remove unused CSS rules
            const optimizedContent = this.removeUnusedCSS(content);
            
            // Minify CSS
            const minifiedContent = this.minifyCSS(optimizedContent);
            
            totalOptimizedSize += minifiedContent.length;
            
            // Create optimized version
            const optimizedPath = cssFile.replace('.css', '.optimized.css');
            fs.writeFileSync(optimizedPath, minifiedContent);
            
            console.log(`  ✨ ${path.basename(cssFile)}: ${content.length} → ${minifiedContent.length} bytes`);
        }
        
        this.optimizationReport.cssOptimization = {
            originalSize: totalOriginalSize,
            optimizedSize: totalOptimizedSize,
            savings: totalOriginalSize - totalOptimizedSize,
            savingsPercent: ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1)
        };
    }

    async optimizeJS() {
        console.log('⚡ Optimizing JavaScript files...');
        
        const jsFiles = this.findFiles(this.jsDir, '.js');
        let totalOriginalSize = 0;
        let totalOptimizedSize = 0;
        
        for (const jsFile of jsFiles) {
            // Skip test files
            if (jsFile.includes('test') || jsFile.includes('spec')) {
                continue;
            }
            
            const content = fs.readFileSync(jsFile, 'utf8');
            totalOriginalSize += content.length;
            
            // Remove unused imports and exports
            const optimizedContent = this.removeUnusedJSCode(content);
            
            // Minify JavaScript (basic minification)
            const minifiedContent = this.minifyJS(optimizedContent);
            
            totalOptimizedSize += minifiedContent.length;
            
            // Create optimized version
            const optimizedPath = jsFile.replace('.js', '.optimized.js');
            fs.writeFileSync(optimizedPath, minifiedContent);
            
            console.log(`  ✨ ${path.basename(jsFile)}: ${content.length} → ${minifiedContent.length} bytes`);
        }
        
        this.optimizationReport.jsOptimization = {
            ...this.optimizationReport.jsOptimization,
            originalSize: totalOriginalSize,
            optimizedSize: totalOptimizedSize,
            savings: totalOriginalSize - totalOptimizedSize,
            savingsPercent: ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1)
        };
    }

    removeUnusedCSS(content) {
        const lines = content.split('\n');
        const optimizedLines = [];
        let inRule = false;
        let currentRule = '';
        let braceCount = 0;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip comments and empty lines
            if (trimmedLine.startsWith('/*') || trimmedLine === '') {
                continue;
            }
            
            // Track CSS rules
            if (trimmedLine.includes('{')) {
                braceCount += (trimmedLine.match(/{/g) || []).length;
                inRule = true;
                currentRule += line + '\n';
            } else if (trimmedLine.includes('}')) {
                braceCount -= (trimmedLine.match(/}/g) || []).length;
                currentRule += line + '\n';
                
                if (braceCount === 0) {
                    // End of rule, check if it's used
                    if (this.isCSSRuleUsed(currentRule)) {
                        optimizedLines.push(currentRule);
                    }
                    currentRule = '';
                    inRule = false;
                }
            } else if (inRule) {
                currentRule += line + '\n';
            } else {
                // Keep non-rule lines (imports, variables, etc.)
                optimizedLines.push(line);
            }
        }
        
        return optimizedLines.join('\n');
    }

    isCSSRuleUsed(rule) {
        // Extract selectors from the rule
        const selectorMatch = rule.match(/^([^{]+){/);
        if (!selectorMatch) return true; // Keep if we can't parse
        
        const selectors = selectorMatch[1].split(',').map(s => s.trim());
        
        // Check if any selector uses classes that are in our used classes set
        return selectors.some(selector => {
            // Extract class names from selector
            const classMatches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
            if (!classMatches) return true; // Keep non-class selectors
            
            return classMatches.some(classMatch => {
                const className = classMatch.substring(1); // Remove the dot
                return this.usedClasses.has(className);
            });
        });
    }

    minifyCSS(content) {
        return content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove last semicolon in rules
            .replace(/\s*{\s*/g, '{') // Remove spaces around braces
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
            .replace(/\s*:\s*/g, ':') // Remove spaces around colons
            .trim();
    }

    removeUnusedJSCode(content) {
        // Remove unused imports (basic implementation)
        const lines = content.split('\n');
        const usedImports = new Set();
        
        // Find all identifiers used in the code
        const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
        let match;
        while ((match = identifierRegex.exec(content)) !== null) {
            usedImports.add(match[1]);
        }
        
        // Filter out unused imports
        const optimizedLines = lines.filter(line => {
            if (line.trim().startsWith('import')) {
                // Extract imported names
                const importMatch = line.match(/import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))/);
                if (importMatch) {
                    const importedNames = importMatch[1] ? 
                        importMatch[1].split(',').map(n => n.trim()) : 
                        [importMatch[2] || importMatch[3]];
                    
                    // Keep import if any imported name is used
                    return importedNames.some(name => usedImports.has(name));
                }
            }
            return true;
        });
        
        return optimizedLines.join('\n');
    }

    minifyJS(content) {
        return content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, '') // Remove line comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
            .replace(/\s*{\s*/g, '{') // Remove spaces around braces
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
            .trim();
    }

    extractImports(content) {
        const imports = [];
        const importRegex = /import\s+(?:(?:(?:\w+)|(?:{[^}]+}))\s+from\s+)?['"`]([^'"`]+)['"`]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        return imports;
    }

    extractExports(content) {
        const exports = [];
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
        let match;
        
        while ((match = exportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        
        return exports;
    }

    findEntryPoints() {
        const entryPoints = [];
        const htmlFiles = this.findFiles('.', '.html');
        
        for (const htmlFile of htmlFiles) {
            const content = fs.readFileSync(htmlFile, 'utf8');
            const scriptMatches = content.match(/<script[^>]+src=["']([^"']+)["']/g);
            
            if (scriptMatches) {
                scriptMatches.forEach(match => {
                    const srcMatch = match.match(/src=["']([^"']+)["']/);
                    if (srcMatch) {
                        entryPoints.push(path.resolve(srcMatch[1]));
                    }
                });
            }
        }
        
        return entryPoints;
    }

    traceUsedModules(importGraph, entryPoints) {
        const usedModules = new Set();
        const toProcess = [...entryPoints];
        
        while (toProcess.length > 0) {
            const currentModule = toProcess.pop();
            
            if (usedModules.has(currentModule)) {
                continue;
            }
            
            usedModules.add(currentModule);
            
            const moduleInfo = importGraph.get(currentModule);
            if (moduleInfo) {
                moduleInfo.imports.forEach(importPath => {
                    const resolvedPath = path.resolve(path.dirname(currentModule), importPath);
                    if (!usedModules.has(resolvedPath)) {
                        toProcess.push(resolvedPath);
                    }
                });
            }
        }
        
        return usedModules;
    }

    findFiles(dir, extension) {
        const files = [];
        
        const scanDir = (currentDir) => {
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scanDir(fullPath);
                } else if (stat.isFile() && item.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        };
        
        scanDir(dir);
        return files;
    }

    async generateReport() {
        console.log('📊 Generating optimization report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalCSSReduction: this.optimizationReport.cssOptimization.savingsPercent + '%',
                totalJSReduction: this.optimizationReport.jsOptimization.savingsPercent + '%',
                unusedCSSClasses: this.findUnusedCSSClasses(),
                unusedJSModules: this.optimizationReport.jsOptimization.unusedFiles?.length || 0
            },
            details: this.optimizationReport,
            recommendations: this.generateRecommendations()
        };
        
        // Write report to file
        const reportPath = path.join(__dirname, '..', 'optimization-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Print summary
        console.log('\n📋 Optimization Summary:');
        console.log(`  CSS Size Reduction: ${report.summary.totalCSSReduction}`);
        console.log(`  JS Size Reduction: ${report.summary.totalJSReduction}`);
        console.log(`  Unused JS Modules: ${report.summary.unusedJSModules}`);
        console.log(`\n📄 Full report saved to: ${reportPath}`);
    }

    findUnusedCSSClasses() {
        // This would require parsing all CSS files to find defined classes
        // and comparing with used classes - simplified for this implementation
        return 0;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.optimizationReport.cssOptimization.savingsPercent > 20) {
            recommendations.push('Consider implementing CSS tree-shaking in your build process');
        }
        
        if (this.optimizationReport.jsOptimization.unusedFiles?.length > 0) {
            recommendations.push('Remove unused JavaScript modules to reduce bundle size');
        }
        
        recommendations.push('Enable gzip compression on your web server');
        recommendations.push('Consider implementing code splitting for better performance');
        recommendations.push('Use a CDN for static assets');
        
        return recommendations;
    }
}

// Run optimization if called directly
if (require.main === module) {
    const optimizer = new BundleOptimizer();
    optimizer.optimize().catch(console.error);
}

module.exports = BundleOptimizer;