// Popup script for Codeforces Extension - DEBUG VERSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Extension loaded');
    
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const approachDiv = document.getElementById('approach');
    const codeDiv = document.getElementById('code');
    const copyApproachBtn = document.getElementById('copyApproach');
    const copyCodeBtn = document.getElementById('copyCode');
    
    // Debug: Check which elements exist
    console.log('🔍 Element check:');
    console.log('generateBtn:', generateBtn ? '✅' : '❌');
    console.log('loadingDiv:', loadingDiv ? '✅' : '❌');
    console.log('resultsDiv:', resultsDiv ? '✅' : '❌');
    console.log('approachDiv:', approachDiv ? '✅' : '❌');
    console.log('codeDiv:', codeDiv ? '✅' : '❌');
    console.log('copyApproachBtn:', copyApproachBtn ? '✅' : '❌');
    console.log('copyCodeBtn:', copyCodeBtn ? '✅' : '❌');
    
    let currentProblem = null;

    // Initialize custom dropdowns
    initializeDropdowns();

    // Skip content script check for now - use mock problem
 chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs[0]?.url?.includes('codeforces.com')) {
        showError("Please use on a Codeforces problem page");
        return;
    }
    
    chrome.runtime.sendMessage(
        {action: 'getProblemData'},
        (response) => {
            if (chrome.runtime.lastError || !response?.problem) {
                console.error('Error:', chrome.runtime.lastError);
                showError("Failed to load problem data");
                return;
            }
            currentProblem = response.problem;
            updateUI();
        }
    );
});
    updateUI();

    // Dropdown functionality
    function initializeDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        console.log('🎛️ Found dropdowns:', dropdowns.length);
        
        dropdowns.forEach(dropdown => {
            const button = dropdown.querySelector('.dropdown-button');
            const menu = dropdown.querySelector('.dropdown-menu');
            const items = dropdown.querySelectorAll('.dropdown-item');
            
            if (button && menu && items.length > 0) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    dropdown.classList.toggle('open');
                    // Close other dropdowns
                    dropdowns.forEach(other => {
                        if (other !== dropdown) {
                            other.classList.remove('open');
                        }
                    });
                });
                
                items.forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const value = item.dataset.value;
                        const text = item.textContent;
                        
                        const buttonText = button.querySelector('span');
                        if (buttonText) {
                            buttonText.textContent = text;
                        }
                        button.dataset.value = value;
                        dropdown.classList.remove('open');
                    });
                });
            }
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('open');
                });
            }
        });
    }

    function updateUI() {
        if (currentProblem) {
            const problemTitleElement = document.getElementById('problemTitle');
            if (problemTitleElement) {
                problemTitleElement.textContent = currentProblem.title;
            }
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    function showError(message) {
        console.error('❌ Error:', message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm';
        errorDiv.textContent = message;
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(errorDiv);
        }
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            console.log('🎯 Generate button clicked');
            if (!currentProblem) {
                showError('No problem detected');
                return;
            }
            generateSolution();
        });
    }

    async function generateSolution() {
            if (!currentProblem?.title) {
        showError("No problem detected on this page");
        return;
    }
        console.log('⚡ Starting solution generation');
        
        // Get values from custom dropdowns
        const approachLangButton = document.getElementById('approachLangSelect');
        const codeLangButton = document.getElementById('codeLangSelect');
        
        const approachLang = approachLangButton?.dataset.value || 'hinglish';
        const codeLang = codeLangButton?.dataset.value || 'cpp';
        
        console.log('🌐 Languages:', { approachLang, codeLang });
        
        // Show loading state
        if (loadingDiv) {
            loadingDiv.classList.remove('show')
            console.log('⏳ Loading shown');
        }
        if (resultsDiv) {
            resultsDiv.classList.remove('show');
        }
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
        }

        try {
            // Simulate API call with mock data
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockSolution = getMockSolution(currentProblem.title, approachLang, codeLang);
            console.log('📝 Mock solution generated');
            
            // Display results
            displayResults(mockSolution.approach, mockSolution.code, codeLang);
            
        } catch (error) {
            console.error('💥 Generation error:', error);
            showError('Failed to generate solution. Please try again.');
        } finally {
            if (loadingDiv) {
                loadingDiv.classList.add('hidden');
                console.log('⏳ Loading hidden');
            }
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Solution';
            }
        }
    }

    function displayResults(approach, code, language) {
        console.log('📊 Displaying results...');
        console.log('Approach length:', approach.length);
        console.log('Code length:', code.length);
        
        if (approachDiv) {
            approachDiv.innerHTML = `<pre class="whitespace-pre-wrap text-sm leading-relaxed">${approach}</pre>`;
            console.log('✅ Approach div updated');
        } else {
            console.error('❌ approachDiv not found!');
        }
        
        if (codeDiv) {
            codeDiv.innerHTML = `<pre><code class="language-${language.toLowerCase()}">${code}</code></pre>`;
            console.log('✅ Code div updated');
        } else {
            console.error('❌ codeDiv not found!');
        }
        
        if (resultsDiv) {
            resultsDiv.classList.add('show');
            console.log('✅ Results div shown');
            // Scroll to results
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.error('❌ resultsDiv not found!');
            
            // Fallback: Create results section if it doesn't exist
            const container = document.querySelector('.container');
            if (container) {
                const resultsHTML = `
                    <div id="results-fallback" class="mt-4 p-4 bg-gray-800 rounded-lg">
                        <h3 class="text-white mb-2">Approach:</h3>
                        <div class="bg-gray-700 p-3 rounded mb-4">
                            <pre class="text-sm text-gray-200 whitespace-pre-wrap">${approach}</pre>
                        </div>
                        <button id="copyApproachFallback" class="bg-blue-500 text-white px-3 py-1 rounded mr-2">Copy Approach</button>
                        
                        <h3 class="text-white mb-2 mt-4">Code:</h3>
                        <div class="bg-gray-700 p-3 rounded mb-4">
                            <pre class="text-sm text-gray-200"><code>${code}</code></pre>
                        </div>
                        <button id="copyCodeFallback" class="bg-blue-500 text-white px-3 py-1 rounded">Copy Code</button>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', resultsHTML);
                console.log('🆘 Fallback results created');
                
                // Add copy functionality to fallback buttons
                document.getElementById('copyApproachFallback')?.addEventListener('click', () => {
                    copyToClipboard(approach, document.getElementById('copyApproachFallback'));
                });
                document.getElementById('copyCodeFallback')?.addEventListener('click', () => {
                    copyToClipboard(code, document.getElementById('copyCodeFallback'));
                });
            }
        }
    }

    // Copy to clipboard functionality
    if (copyApproachBtn) {
        copyApproachBtn.addEventListener('click', function() {
            const text = approachDiv.textContent;
            copyToClipboard(text, copyApproachBtn);
        });
    }

    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', function() {
            const text = codeDiv.textContent;
            copyToClipboard(text, copyCodeBtn);
        });
    }

    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('bg-green-500');
            console.log('📋 Text copied to clipboard');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('bg-green-500');
            }, 2000);
        } catch (err) {
            console.error('❌ Failed to copy text:', err);
        }
    }

    function getMockSolution(problemTitle, approachLang, codeLang) {
        
const approaches = {
    english: {
        default: `To solve this problem, we need to analyze the constraints and find an efficient approach:

1. First, understand the problem requirements and constraints
2. Identify the key patterns or mathematical relationships
3. Choose the appropriate data structures and algorithms
4. Implement the solution with proper edge case handling
5. Optimize for time and space complexity

Key insights:
- Look for patterns in the input/output examples
- Consider greedy approaches for optimization problems
- Use appropriate data structures (arrays, maps, sets)
- Handle edge cases like empty inputs or boundary values

Time Complexity: O(n) or O(n log n) depending on the approach
Space Complexity: O(1) or O(n) for additional storage`
    },
    hinglish: {
        default: `Is problem ko solve karne ke liye humein step-by-step approach follow karna hoga:

1. Pehle problem statement ko achhe se samjho aur constraints check karo
2. Examples dekh kar pattern identify karo
3. Efficient algorithm choose karo jo time limit mein run ho sake
4. Code likhte waqt edge cases handle karna mat bhoolna

Key points:
- Input/output examples mein pattern dhundho
- Agar optimization problem hai to greedy approach try karo
- Sahi data structures use karo (arrays, maps, sets)
- Empty inputs ya boundary values handle karo

Time Complexity: O(n) ya O(n log n) approach ke hisaab se
Space Complexity: O(1) ya O(n) extra storage ke liye`
    }
};

const codes = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

void solve() {
    // Solution logic here
    int n;
    cin >> n;
    // Your code here
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int t = 1;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}`,

    python: `def solve():
    import sys
    input = sys.stdin.read
    data = input().split()
    
    idx = 0
    t = int(data[idx])
    idx += 1
    
    for _ in range(t):
        n = int(data[idx])
        idx += 1
        # Your code here

if __name__ == "__main__":
    solve()`,

    java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int t = sc.nextInt();
        while (t-- > 0) {
            int n = sc.nextInt();
            // Your solution here
        }
        sc.close();
    }
}`,

    c: `#include <stdio.h>

void solve() {
    int n;
    scanf("%d", &n);
    // Your solution here
}

int main() {
    int t;
    scanf("%d", &t);
    while (t--) {
        solve();
    }
    return 0;
}`
};
        return {
            approach: approaches[approachLang]?.general || approaches.english.general,
            code: codes[codeLang] || codes.cpp
        };
    }
});