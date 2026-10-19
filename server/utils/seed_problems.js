// ====================================================
// Problem Seeder Utility — CareerPilot AI
//
// Populates the database with 15 curated placement coding problems:
// - 5 Easy
// - 5 Medium
// - 5 Hard
// Spanning Arrays, Strings, Hashing, Two Pointers, Stacks, DP, Trees & Graphs.
// Every problem provides clean BLANK starter templates for Python, JavaScript, Java, and C++.
//
// Usage: `node server/utils/seed_problems.js`
// ====================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');

const problems = [
  // ====================================================
  // 5 EASY PROBLEMS
  // ====================================================
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Hash Table'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.

### Input Format:
- Line 1: Space-separated integers representing \`nums\`.
- Line 2: An integer representing \`target\`.

### Output Format:
- Print the two 0-indexed positions separated by a space (e.g. \`0 1\`).`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    sampleTestCases: [
      { input: '2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9.' },
      { input: '3 2 4\n6', output: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6.' }
    ],
    evalTestCases: [
      { input: '2 7 11 15\n9', output: '0 1', isHidden: false },
      { input: '3 2 4\n6', output: '1 2', isHidden: false },
      { input: '3 3\n6', output: '0 1', isHidden: true },
      { input: '1 5 8 12 17 25\n20', output: '2 3', isHidden: true },
      { input: '-3 4 3 90\n0', output: '0 2', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def two_sum(nums, target):
    # Write your solution here
    pass

if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 2:
        nums = list(map(int, lines[0].strip().split()))
        target = int(lines[1].strip())
        print(two_sum(nums, target))
`,
      javascript: `const fs = require('fs');

function twoSum(nums, target) {
    // Write your solution here
    return '';
}

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const nums = input[0].trim().split(/\\s+/).map(Number);
    const target = parseInt(input[1].trim(), 10);
    console.log(twoSum(nums, target));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        int target = sc.nextInt();
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string line;
    if (!getline(cin, line)) return 0;
    stringstream ss(line);
    vector<int> nums;
    int val, target;
    while (ss >> val) nums.push_back(val);
    if (cin >> target) {
        // Write your solution here
    }
    return 0;
}
`
    },
    editorial: `### Optimal Solution: One-pass Hash Map
Store visited numbers in a hash map mapping \`value -> index\`. Check if \`target - num\` exists.
- **Time Complexity:** O(N)
- **Space Complexity:** O(N)`
  },

  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    category: 'Stack & Queue',
    tags: ['String', 'Stack'],
    description: `Given a string \`s\` containing characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if open brackets are closed by the same type of brackets in the correct order.

### Input Format:
- A single string \`s\`.

### Output Format:
- Print \`true\` if the string is valid, or \`false\` otherwise.`,
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only: ()[]{}'
    ],
    sampleTestCases: [
      { input: '()', output: 'true', explanation: 'Matching pair.' },
      { input: '()[]{}', output: 'true', explanation: 'All matching pairs.' },
      { input: '(]', output: 'false', explanation: 'Mismatched brackets.' }
    ],
    evalTestCases: [
      { input: '()', output: 'true', isHidden: false },
      { input: '()[]{}', output: 'true', isHidden: false },
      { input: '(]', output: 'false', isHidden: false },
      { input: '([)]', output: 'false', isHidden: true },
      { input: '{[]}', output: 'true', isHidden: true },
      { input: '(((', output: 'false', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def is_valid(s):
    # Write your solution here
    pass

if __name__ == '__main__':
    s = sys.stdin.read().strip()
    print(is_valid(s))
`,
      javascript: `const fs = require('fs');

function isValid(s) {
    // Write your solution here
    return 'false';
}

const input = fs.readFileSync(0, 'utf-8').trim();
console.log(isValid(input));
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNext() ? sc.next().trim() : "";
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s;
    if (cin >> s) {
        // Write your solution here
    }
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Stack
Push open brackets onto a stack. When encountering a closing bracket, pop the top and verify.
- **Time Complexity:** O(N)
- **Space Complexity:** O(N)`
  },

  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Dynamic Programming'],
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day.

Maximize your profit by choosing a single day to buy one stock and a different day in the future to sell. Return the maximum profit (or 0 if no profit is possible).

### Input Format:
- Space-separated integers representing daily stock prices.

### Output Format:
- An integer representing maximum profit.`,
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4'
    ],
    sampleTestCases: [
      { input: '7 1 5 3 6 4', output: '5', explanation: 'Buy day 2 (1) and sell day 5 (6), profit = 5.' },
      { input: '7 6 4 3 1', output: '0', explanation: 'Prices continuously decrease, no profit.' }
    ],
    evalTestCases: [
      { input: '7 1 5 3 6 4', output: '5', isHidden: false },
      { input: '7 6 4 3 1', output: '0', isHidden: false },
      { input: '2 4 1', output: '2', isHidden: true },
      { input: '1 2', output: '1', isHidden: true },
      { input: '3 2 6 5 0 3', output: '4', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def max_profit(prices):
    # Write your solution here
    pass

if __name__ == '__main__':
    data = sys.stdin.read().strip()
    if data:
        prices = list(map(int, data.split()))
        print(max_profit(prices))
`,
      javascript: `const fs = require('fs');

function maxProfit(prices) {
    // Write your solution here
    return 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const prices = input.split(/\\s+/).map(Number);
    console.log(maxProfit(prices));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> prices = new ArrayList<>();
        while (sc.hasNextInt()) prices.add(sc.nextInt());
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    vector<int> prices;
    int p;
    while (cin >> p) prices.push_back(p);
    // Write your solution here
    return 0;
}
`
    },
    editorial: `### Optimal Solution: One-pass Greedy
Track minimum price seen so far and update maximum profit.
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)`
  },

  {
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    category: 'Searching & Sorting',
    tags: ['Array', 'Binary Search'],
    description: `Given a sorted array of integers \`nums\` and an integer \`target\`, search \`target\` in \`nums\`. Return its 0-indexed position or \`-1\` if not present.

### Input Format:
- Line 1: Space-separated integers representing sorted array \`nums\`.
- Line 2: An integer representing \`target\`.

### Output Format:
- The 0-based index of \`target\`, or \`-1\`.`,
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 < nums[i], target < 10^4',
      'nums is sorted in ascending order.'
    ],
    sampleTestCases: [
      { input: '-1 0 3 5 9 12\n9', output: '4', explanation: '9 exists at index 4.' },
      { input: '-1 0 3 5 9 12\n2', output: '-1', explanation: '2 does not exist, return -1.' }
    ],
    evalTestCases: [
      { input: '-1 0 3 5 9 12\n9', output: '4', isHidden: false },
      { input: '-1 0 3 5 9 12\n2', output: '-1', isHidden: false },
      { input: '5\n5', output: '0', isHidden: true },
      { input: '2 5\n5', output: '1', isHidden: true },
      { input: '1 3 5 7 9 11 13\n13', output: '6', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def search(nums, target):
    # Write your solution here
    pass

if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 2:
        nums = list(map(int, lines[0].strip().split()))
        target = int(lines[1].strip())
        print(search(nums, target))
`,
      javascript: `const fs = require('fs');

function search(nums, target) {
    // Write your solution here
    return -1;
}

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const nums = input[0].trim().split(/\\s+/).map(Number);
    const target = parseInt(input[1].trim(), 10);
    console.log(search(nums, target));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        int target = sc.nextInt();
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string line;
    if (!getline(cin, line)) return 0;
    stringstream ss(line);
    vector<int> nums;
    int val, target;
    while (ss >> val) nums.push_back(val);
    if (cin >> target) {
        // Write your solution here
    }
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Standard Binary Search
Halve search space at each iteration: \`low = mid + 1\` or \`high = mid - 1\`.
- **Time Complexity:** O(log N)
- **Space Complexity:** O(1)`
  },

  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    tags: ['Math', 'Dynamic Programming'],
    description: `You are climbing a staircase with \`n\` steps. Each time you can climb either \`1\` or \`2\` steps. In how many distinct ways can you reach the top?

### Input Format:
- A single integer \`n\`.

### Output Format:
- An integer representing distinct combinations of steps.`,
    constraints: ['1 <= n <= 45'],
    sampleTestCases: [
      { input: '2', output: '2', explanation: 'Two ways: 1+1 or 2.' },
      { input: '3', output: '3', explanation: 'Three ways: 1+1+1, 1+2, or 2+1.' }
    ],
    evalTestCases: [
      { input: '2', output: '2', isHidden: false },
      { input: '3', output: '3', isHidden: false },
      { input: '4', output: '5', isHidden: true },
      { input: '5', output: '8', isHidden: true },
      { input: '10', output: '89', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def climb_stairs(n):
    # Write your solution here
    pass

if __name__ == '__main__':
    data = sys.stdin.read().strip()
    if data:
        print(climb_stairs(int(data)))
`,
      javascript: `const fs = require('fs');

function climbStairs(n) {
    // Write your solution here
    return 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    console.log(climbStairs(parseInt(input, 10)));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            // Write your solution here
        }
    }
}
`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (cin >> n) {
        // Write your solution here
    }
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Fibonacci DP
Recurrence: \`ways(n) = ways(n-1) + ways(n-2)\`.
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)`
  },

  // ====================================================
  // 5 MEDIUM PROBLEMS
  // ====================================================
  {
    title: 'Maximum Subarray (Kadane’s Algorithm)',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Dynamic Programming'],
    description: `Given an integer array \`nums\`, find the contiguous subarray (containing at least one number) which has the largest sum and return *its sum*.

### Input Format:
- Space-separated integers representing \`nums\`.

### Output Format:
- An integer representing the maximum contiguous subarray sum.`,
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4'
    ],
    sampleTestCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: 'Subarray [4, -1, 2, 1] has largest sum = 6.' },
      { input: '1', output: '1', explanation: 'Only 1 element.' }
    ],
    evalTestCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', output: '6', isHidden: false },
      { input: '1', output: '1', isHidden: false },
      { input: '5 4 -1 7 8', output: '23', isHidden: false },
      { input: '-1', output: '-1', isHidden: true },
      { input: '-2 -1', output: '-1', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def max_sub_array(nums):
    # Write your solution here
    pass

if __name__ == '__main__':
    data = sys.stdin.read().strip()
    if data:
        nums = list(map(int, data.split()))
        print(max_sub_array(nums))
`,
      javascript: `const fs = require('fs');

function maxSubArray(nums) {
    // Write your solution here
    return 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const nums = input.split(/\\s+/).map(Number);
    console.log(maxSubArray(nums));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) nums.add(sc.nextInt());
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    vector<int> nums;
    int x;
    while (cin >> x) nums.push_back(x);
    // Write your solution here
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Kadane's Algorithm
At each element, choose whether to extend the current subarray or start fresh: \`current = max(x, current + x)\`.
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)`
  },

  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    description: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.

### Input Format:
- A single string \`s\`.

### Output Format:
- An integer representing the length of the longest substring.`,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    sampleTestCases: [
      { input: 'abcabcbb', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 'bbbbb', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 'pwwkew', output: '3', explanation: 'The answer is "wke", with the length of 3.' }
    ],
    evalTestCases: [
      { input: 'abcabcbb', output: '3', isHidden: false },
      { input: 'bbbbb', output: '1', isHidden: false },
      { input: 'pwwkew', output: '3', isHidden: false },
      { input: 'a', output: '1', isHidden: true },
      { input: 'dvdf', output: '3', isHidden: true },
      { input: 'anviaj', output: '5', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def length_of_longest_substring(s):
    # Write your solution here
    pass

if __name__ == '__main__':
    s = sys.stdin.read().strip()
    print(length_of_longest_substring(s))
`,
      javascript: `const fs = require('fs');

function lengthOfLongestSubstring(s) {
    // Write your solution here
    return 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
console.log(lengthOfLongestSubstring(input));
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine().trim() : "";
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s;
    if (getline(cin, s)) {
        // Write your solution here
    }
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Sliding Window with Hash Map
Use two pointers \`left\` and \`right\`. Store character indices in a map and adjust \`left\` whenever duplicate occurs.
- **Time Complexity:** O(N)
- **Space Complexity:** O(min(M, N))`
  },

  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Greedy'],
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.

### Input Format:
- Space-separated integers representing the array \`height\`.

### Output Format:
- An integer representing maximum water capacity.`,
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4'
    ],
    sampleTestCases: [
      { input: '1 8 6 2 5 4 8 3 7', output: '49', explanation: 'Max area is between index 1 and 8: min(8, 7) * 7 = 49.' },
      { input: '1 1', output: '1', explanation: 'Area = min(1, 1) * 1 = 1.' }
    ],
    evalTestCases: [
      { input: '1 8 6 2 5 4 8 3 7', output: '49', isHidden: false },
      { input: '1 1', output: '1', isHidden: false },
      { input: '4 3 2 1 4', output: '16', isHidden: true },
      { input: '1 2 1', output: '2', isHidden: true },
      { input: '2 3 4 5 18 17 6', output: '17', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def max_area(height):
    # Write your solution here
    pass

if __name__ == '__main__':
    data = sys.stdin.read().strip()
    if data:
        height = list(map(int, data.split()))
        print(max_area(height))
`,
      javascript: `const fs = require('fs');

function maxArea(height) {
    // Write your solution here
    return 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const height = input.split(/\\s+/).map(Number);
    console.log(maxArea(height));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    vector<int> height;
    int h;
    while (cin >> h) height.push_back(h);
    // Write your solution here
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Two Pointers
Initialize \`left = 0\` and \`right = n - 1\`. Calculate area \`min(height[left], height[right]) * (right - left)\` and shrink the shorter side inward.
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)`
  },

  {
    title: '3Sum',
    slug: '3sum',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    description: `Given an integer array \`nums\`, return the number of distinct triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.

### Input Format:
- Space-separated integers representing \`nums\`.

### Output Format:
- An integer representing the count of unique triplets that sum to 0.`,
    constraints: [
      '3 <= nums.length <= 3000',
      '-10^5 <= nums[i] <= 10^5'
    ],
    sampleTestCases: [
      { input: '-1 0 1 2 -1 -4', output: '2', explanation: 'Triplets are [-1, -1, 2] and [-1, 0, 1]. Count = 2.' },
      { input: '0 1 1', output: '0', explanation: 'No triplets sum to 0.' },
      { input: '0 0 0', output: '1', explanation: 'Only [0, 0, 0]. Count = 1.' }
    ],
    evalTestCases: [
      { input: '-1 0 1 2 -1 -4', output: '2', isHidden: false },
      { input: '0 1 1', output: '0', isHidden: false },
      { input: '0 0 0', output: '1', isHidden: false },
      { input: '-2 0 1 1 2', output: '2', isHidden: true },
      { input: '-1 -1 -1 2', output: '1', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def three_sum(nums):
    # Write your solution here
    pass

if __name__ == '__main__':
    data = sys.stdin.read().strip()
    if data:
        nums = list(map(int, data.split()))
        print(three_sum(nums))
`,
      javascript: `const fs = require('fs');

function threeSum(nums) {
    // Write your solution here
    return 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const nums = input.split(/\\s+/).map(Number);
    console.log(threeSum(nums));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) nums.add(sc.nextInt());
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    vector<int> nums;
    int v;
    while (cin >> v) nums.push_back(v);
    // Write your solution here
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Sorting + Two Pointers
Sort \`nums\`. For each index \`i\`, use two pointers \`left = i + 1\` and \`right = n - 1\` to find pairs summing to \`-nums[i]\`. Skip duplicate numbers.
- **Time Complexity:** O(N^2)
- **Space Complexity:** O(1) or O(N) depending on sorting`
  },

  {
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the **fewest number of coins** that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.

### Input Format:
- Line 1: Space-separated integers representing the coins array.
- Line 2: An integer representing \`amount\`.

### Output Format:
- An integer representing the minimum coins required, or \`-1\`.`,
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4'
    ],
    sampleTestCases: [
      { input: '1 2 5\n11', output: '3', explanation: '11 = 5 + 5 + 1 (3 coins).' },
      { input: '2\n3', output: '-1', explanation: 'Cannot form 3 using only 2s.' },
      { input: '1\n0', output: '0', explanation: '0 amount requires 0 coins.' }
    ],
    evalTestCases: [
      { input: '1 2 5\n11', output: '3', isHidden: false },
      { input: '2\n3', output: '-1', isHidden: false },
      { input: '1\n0', output: '0', isHidden: false },
      { input: '186 419 83 408\n6249', output: '20', isHidden: true },
      { input: '2 5 10 1\n27', output: '4', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def coin_change(coins, amount):
    # Write your solution here
    pass

if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 2:
        coins = list(map(int, lines[0].strip().split()))
        amount = int(lines[1].strip())
        print(coin_change(coins, amount))
`,
      javascript: `const fs = require('fs');

function coinChange(coins, amount) {
    // Write your solution here
    return -1;
}

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const coins = input[0].trim().split(/\\s+/).map(Number);
    const amount = parseInt(input[1].trim(), 10);
    console.log(coinChange(coins, amount));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        int[] coins = new int[parts.length];
        for (int i = 0; i < parts.length; i++) coins[i] = Integer.parseInt(parts[i]);
        int amount = sc.nextInt();
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string line;
    if (!getline(cin, line)) return 0;
    stringstream ss(line);
    vector<int> coins;
    int c, amount;
    while (ss >> c) coins.push_back(c);
    if (cin >> amount) {
        // Write your solution here
    }
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Bottom-Up DP
Create \`dp[0...amount]\` filled with infinity. \`dp[0] = 0\`.
For each coin: \`dp[i] = min(dp[i], dp[i - coin] + 1)\`.
- **Time Complexity:** O(amount * len(coins))
- **Space Complexity:** O(amount)`
  },

  // ====================================================
  // 5 HARD PROBLEMS
  // ====================================================
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    category: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Input Format:
- Space-separated integers representing the array \`height\`.

### Output Format:
- An integer representing total units of trapped rain water.`,
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5'
    ],
    sampleTestCases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', output: '6', explanation: '6 units of water are trapped.' },
      { input: '4 2 0 3 2 5', output: '9', explanation: '9 units of water are trapped.' }
    ],
    evalTestCases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', output: '6', isHidden: false },
      { input: '4 2 0 3 2 5', output: '9', isHidden: false },
      { input: '3 0 0 2 0 4', output: '10', isHidden: true },
      { input: '1 2 3 4', output: '0', isHidden: true },
      { input: '5 4 1 2', output: '1', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def trap(height):
    # Write your solution here
    pass

if __name__ == '__main__':
    data = sys.stdin.read().strip()
    if data:
        height = list(map(int, data.split()))
        print(trap(height))
`,
      javascript: `const fs = require('fs');

function trap(height) {
    // Write your solution here
    return 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const height = input.split(/\\s+/).map(Number);
    console.log(trap(height));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    vector<int> height;
    int h;
    while (cin >> h) height.push_back(h);
    // Write your solution here
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Two Pointers
Maintain \`left_max\` and \`right_max\`. If \`height[left] < height[right]\`, process left side: \`ans += max(0, left_max - height[left])\`, otherwise process right side.
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)`
  },

  {
    title: 'Longest Valid Parentheses',
    slug: 'longest-valid-parentheses',
    difficulty: 'Hard',
    category: 'Stack & Queue',
    tags: ['String', 'Dynamic Programming', 'Stack'],
    description: `Given a string containing just the characters \`'('\` and \`')'\`, return the length of the longest valid (well-formed) parentheses substring.

### Input Format:
- A single string of parentheses \`s\`.

### Output Format:
- An integer representing the length of the longest valid parentheses substring.`,
    constraints: [
      '0 <= s.length <= 3 * 10^4',
      's[i] is \'(\', or \')\'.'
    ],
    sampleTestCases: [
      { input: '(()', output: '2', explanation: 'The longest valid parentheses substring is "()".' },
      { input: ')()())', output: '4', explanation: 'The longest valid parentheses substring is "()()".' },
      { input: ')(', output: '0', explanation: 'No valid parentheses substring.' }
    ],
    evalTestCases: [
      { input: '(()', output: '2', isHidden: false },
      { input: '()()', output: '4', isHidden: false },
      { input: ')(', output: '0', isHidden: false },
      { input: '()(()', output: '2', isHidden: true },
      { input: '()(())', output: '6', isHidden: true },
      { input: '((()))', output: '6', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def longest_valid_parentheses(s):
    # Write your solution here
    pass

if __name__ == '__main__':
    s = sys.stdin.read().strip()
    print(longest_valid_parentheses(s))
`,
      javascript: `const fs = require('fs');

function longestValidParentheses(s) {
    // Write your solution here
    return 0;
}

const input = fs.readFileSync(0, 'utf-8').trim();
console.log(longestValidParentheses(input));
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNext() ? sc.next().trim() : "";
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s;
    if (cin >> s) {
        // Write your solution here
    }
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Stack of Indices
Push \`-1\` onto the stack as a base index. For \`'('\`, push index. For \`')'\`, pop. If stack is empty, push current index. Otherwise \`max_len = max(max_len, i - stack.top())\`.
- **Time Complexity:** O(N)
- **Space Complexity:** O(N)`
  },

  {
    title: 'Merge k Sorted Lists',
    slug: 'merge-k-sorted-lists',
    difficulty: 'Hard',
    category: 'Linked Lists',
    tags: ['Linked List', 'Divide and Conquer', 'Heap (Priority Queue)'],
    description: `You are given an array of \`k\` linked-lists \`lists\`, each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return its values in order.

### Input Format:
- Line 1: An integer \`k\` representing the number of lists.
- Next \`k\` lines: Space-separated integers representing each sorted list (empty line for empty list).

### Output Format:
- Space-separated integers representing the merged sorted list.`,
    constraints: [
      'k == lists.length',
      '0 <= k <= 10^4',
      '0 <= lists[i].length <= 500',
      '-10^4 <= lists[i][j] <= 10^4'
    ],
    sampleTestCases: [
      { input: '3\n1 4 5\n1 3 4\n2 6', output: '1 1 2 3 4 4 5 6', explanation: 'All 3 lists merged in sorted order.' },
      { input: '1\n5', output: '5', explanation: 'Single list with element 5.' }
    ],
    evalTestCases: [
      { input: '3\n1 4 5\n1 3 4\n2 6', output: '1 1 2 3 4 4 5 6', isHidden: false },
      { input: '1\n5', output: '5', isHidden: false },
      { input: '2\n1 2\n3 4', output: '1 2 3 4', isHidden: true },
      { input: '3\n-2 -1\n-3 0\n2', output: '-3 -2 -1 0 2', isHidden: true }
    ],
    starterCode: {
      python: `import sys
import heapq

def merge_k_lists(lists):
    # Write your solution here
    pass

if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        k = int(lines[0].strip())
        lists = []
        for i in range(1, k + 1):
            if i < len(lines) and lines[i].strip():
                lists.append(list(map(int, lines[i].strip().split())))
            else:
                lists.append([])
        res = merge_k_lists(lists)
        print(' '.join(map(str, res)))
`,
      javascript: `const fs = require('fs');

function mergeKLists(lists) {
    // Write your solution here
    return [];
}

const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length > 0 && lines[0].trim()) {
    const k = parseInt(lines[0].trim(), 10);
    const lists = [];
    for (let i = 1; i <= k; i++) {
        if (i < lines.length && lines[i].trim()) {
            lists.push(lines[i].trim().split(/\\s+/).map(Number));
        } else {
            lists.push([]);
        }
    }
    console.log(mergeKLists(lists).join(' '));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int k = sc.nextInt();
        sc.nextLine();
        List<List<Integer>> lists = new ArrayList<>();
        for (int i = 0; i < k; i++) {
            List<Integer> list = new ArrayList<>();
            if (sc.hasNextLine()) {
                String line = sc.nextLine().trim();
                if (!line.isEmpty()) {
                    for (String s : line.split("\\\\s+")) list.add(Integer.parseInt(s));
                }
            }
            lists.add(list);
        }
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int k;
    if (!(cin >> k)) return 0;
    string dummy;
    getline(cin, dummy);
    vector<vector<int>> lists(k);
    for (int i = 0; i < k; i++) {
        string line;
        if (getline(cin, line)) {
            stringstream ss(line);
            int v;
            while (ss >> v) lists[i].push_back(v);
        }
    }
    // Write your solution here
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Min-Heap / Priority Queue
Push the first element of each of the k lists into a min-heap. Pop the minimum element, append to result, and insert its next element.
- **Time Complexity:** O(N log k) where N is total number of nodes
- **Space Complexity:** O(k)`
  },

  {
    title: 'Edit Distance',
    slug: 'edit-distance',
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    tags: ['String', 'Dynamic Programming'],
    description: `Given two strings \`word1\` and \`word2\`, return the *minimum number of operations* required to convert \`word1\` to \`word2\`.

You have the following three operations permitted on a word:
1. Insert a character
2. Delete a character
3. Replace a character

### Input Format:
- Line 1: String \`word1\`.
- Line 2: String \`word2\`.

### Output Format:
- An integer representing the minimum operations.`,
    constraints: [
      '0 <= word1.length, word2.length <= 500',
      'word1 and word2 consist of lowercase English letters.'
    ],
    sampleTestCases: [
      { input: 'horse\nros', output: '3', explanation: 'horse -> rorse (replace h with r) -> rose (remove r) -> ros (remove e).' },
      { input: 'intention\nexecution', output: '5', explanation: 'intention -> execution in 5 operations.' }
    ],
    evalTestCases: [
      { input: 'horse\nros', output: '3', isHidden: false },
      { input: 'intention\nexecution', output: '5', isHidden: false },
      { input: 'a\nb', output: '1', isHidden: true },
      { input: 'park\nspake', output: '3', isHidden: true },
      { input: 'zoologico\nzoologico', output: '0', isHidden: true }
    ],
    starterCode: {
      python: `import sys

def min_distance(word1, word2):
    # Write your solution here
    pass

if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    w1 = lines[0].strip() if len(lines) > 0 else ''
    w2 = lines[1].strip() if len(lines) > 1 else ''
    print(min_distance(w1, w2))
`,
      javascript: `const fs = require('fs');

function minDistance(word1, word2) {
    // Write your solution here
    return 0;
}

const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
const w1 = lines[0] ? lines[0].trim() : '';
const w2 = lines[1] ? lines[1].trim() : '';
console.log(minDistance(w1, w2));
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String w1 = sc.hasNextLine() ? sc.nextLine().trim() : "";
        String w2 = sc.hasNextLine() ? sc.nextLine().trim() : "";
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string w1, w2;
    getline(cin, w1);
    getline(cin, w2);
    // Write your solution here
    return 0;
}
`
    },
    editorial: `### Optimal Solution: 2D Dynamic Programming (Levenshtein)
\`dp[i][j]\` represents edit distance between \`word1[0...i]\` and \`word2[0...j]\`.
If characters match: \`dp[i][j] = dp[i-1][j-1]\`.
Otherwise: \`1 + min(insert: dp[i][j-1], delete: dp[i-1][j], replace: dp[i-1][j-1])\`.
- **Time Complexity:** O(M * N)
- **Space Complexity:** O(M * N)`
  },

  {
    title: 'Word Ladder',
    slug: 'word-ladder',
    difficulty: 'Hard',
    category: 'Graphs',
    tags: ['Hash Table', 'String', 'Breadth-First Search'],
    description: `A **transformation sequence** from word \`beginWord\` to word \`endWord\` using a dictionary \`wordList\` is a sequence of words \`beginWord -> s1 -> s2 -> ... -> sk\` such that:
- Every adjacent pair of words differs by a single letter.
- Every \`si\` for \`1 <= i <= k\` is in \`wordList\`. Note that \`beginWord\` does not need to be in \`wordList\`.
- \`sk == endWord\`

Given two words, \`beginWord\` and \`endWord\`, and a dictionary \`wordList\`, return the **number of words** in the **shortest transformation sequence**, or \`0\` if no such sequence exists.

### Input Format:
- Line 1: String \`beginWord\`.
- Line 2: String \`endWord\`.
- Line 3: Space-separated words in \`wordList\`.

### Output Format:
- An integer representing length of the shortest transformation sequence.`,
    constraints: [
      '1 <= beginWord.length <= 10',
      'endWord.length == beginWord.length',
      '1 <= wordList.length <= 5000',
      'All words consist of lowercase English letters.'
    ],
    sampleTestCases: [
      { input: 'hit\ncog\nhot dot dog lot log cog', output: '5', explanation: '"hit" -> "hot" -> "dot" -> "dog" -> "cog" (5 words).' },
      { input: 'hit\ncog\nhot dot dog lot log', output: '0', explanation: '"cog" is not in wordList so impossible.' }
    ],
    evalTestCases: [
      { input: 'hit\ncog\nhot dot dog lot log cog', output: '5', isHidden: false },
      { input: 'hit\ncog\nhot dot dog lot log', output: '0', isHidden: false },
      { input: 'a\nc\na b c', output: '2', isHidden: true },
      { input: 'hot\ndog\nhot dog', output: '0', isHidden: true },
      { input: 'leet\ncode\nloot lode coat leet code', output: '0', isHidden: true }
    ],
    starterCode: {
      python: `import sys
from collections import deque

def ladder_length(begin_word, end_word, word_list):
    # Write your solution here
    pass

if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 3:
        bw = lines[0].strip()
        ew = lines[1].strip()
        words = lines[2].strip().split()
        print(ladder_length(bw, ew, words))
`,
      javascript: `const fs = require('fs');

function ladderLength(beginWord, endWord, wordList) {
    // Write your solution here
    return 0;
}

const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 3) {
    const bw = lines[0].trim();
    const ew = lines[1].trim();
    const words = lines[2].trim().split(/\\s+/);
    console.log(ladderLength(bw, ew, words));
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String bw = sc.nextLine().trim();
        String ew = sc.nextLine().trim();
        List<String> words = new ArrayList<>();
        if (sc.hasNextLine()) {
            for (String w : sc.nextLine().trim().split("\\\\s+")) words.add(w);
        }
        // Write your solution here
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string bw, ew, line;
    if (getline(cin, bw) && getline(cin, ew) && getline(cin, line)) {
        stringstream ss(line);
        vector<string> words;
        string w;
        while (ss >> w) words.push_back(w);
        // Write your solution here
    }
    return 0;
}
`
    },
    editorial: `### Optimal Solution: Breadth-First Search (BFS)
Treat each word as a node in an undirected graph where edges connect words differing by 1 character. Perform standard or bidirectional BFS from \`beginWord\` to \`endWord\`.
- **Time Complexity:** O(M^2 * N) where M is word length, N is dictionary size
- **Space Complexity:** O(M * N)`
  }
];

const seedProblems = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal_pro';
    await mongoose.connect(mongoUri);
    console.log('Connected to database for problem seeding...');

    // Clear existing to ensure clean schema update and remove old pre-solved starterCode
    await CodingProblem.deleteMany({});
    console.log('Cleared existing problem collection for clean refresh...');

    for (const prob of problems) {
      await CodingProblem.create(prob);
      console.log(`Seeded problem: ${prob.title} [${prob.difficulty}] - ${prob.category}`);
    }

    const easyCount = problems.filter(p => p.difficulty === 'Easy').length;
    const medCount = problems.filter(p => p.difficulty === 'Medium').length;
    const hardCount = problems.filter(p => p.difficulty === 'Hard').length;

    console.log(`\n====================================================`);
    console.log(`Successfully seeded ${problems.length} placement coding problems!`);
    console.log(`- Easy:   ${easyCount}`);
    console.log(`- Medium: ${medCount}`);
    console.log(`- Hard:   ${hardCount}`);
    console.log(`- Languages: Python 3, JavaScript (Node), Java, C++`);
    console.log(`====================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding problems:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedProblems();
}

module.exports = { seedProblems, problems };
