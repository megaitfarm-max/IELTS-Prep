// Teaching content for each IELTS module
// Users learn before taking tests

export const learningModules = {
  listening: {
    title: 'Listening Skills Training',
    icon: '🎧',
    color: 'var(--listening-primary)',
    lessons: [
      {
        id: 1,
        title: 'Understanding Main Ideas',
        duration: '10 min',
        content: `
## Listening for Main Ideas

In IELTS Listening, you need to understand the overall message, not just individual words.

### Key Strategies:
1. **Focus on context** - What is the situation? Who is speaking?
2. **Listen for keywords** - Names, numbers, dates, places
3. **Predict content** - Read questions first to know what to listen for
4. **Don't panic if you miss something** - Keep listening, move forward

### Common Question Types:
- Form completion
- Multiple choice
- Matching
- Labeling diagrams/maps
- Sentence completion

### Practice Tip:
Listen to English podcasts, news, and conversations daily. Start with slow, clear speech and gradually increase difficulty.
        `,
        examples: [
          {
            audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            question: 'What is the main topic?',
            answer: 'Apartment rental',
            explanation: 'The conversation is between a student and a housing agent discussing flat rental.'
          }
        ]
      },
      {
        id: 2,
        title: 'Note-Taking Techniques',
        duration: '8 min',
        content: `
## Effective Note-Taking

You can write on the question paper during the test. Use this wisely!

### Abbreviation System:
- w/ = with
- w/o = without
- @ = at
- approx = approximately
- info = information
- appt = appointment

### What to Note:
✓ Numbers and dates
✓ Names and spellings
✓ Key facts
✓ Answers you're unsure about (mark with ?)

### Transfer Technique:
You get 10 minutes at the end to transfer answers. Use it to:
- Check spelling
- Verify numbers
- Complete missed answers
- Review uncertain answers
        `
      }
    ]
  },
  
  reading: {
    title: 'Reading Skills Training',
    icon: '📖',
    color: 'var(--reading-primary)',
    lessons: [
      {
        id: 1,
        title: 'Skimming and Scanning',
        duration: '12 min',
        content: `
## Reading Efficiently

You have 60 minutes for 3 passages and 40 questions. Speed is essential!

### Skimming (3-4 minutes per passage):
1. Read title and subtitles
2. First sentence of each paragraph
3. Last paragraph
4. Get general idea WITHOUT reading every word

### Scanning (for specific information):
- Move eyes quickly over text
- Look for keywords from questions
- Find specific facts, numbers, names

### Time Management:
- Passage 1 (easiest): 15 minutes
- Passage 2 (moderate): 20 minutes
- Passage 3 (hardest): 25 minutes

### Don't:
❌ Read everything word-by-word
❌ Spend too long on one question
❌ Leave answers blank (guess if needed)
        `,
        examples: [
          {
            text: 'Coffee originated in Ethiopia around 850 AD. A goat herder named Kaldi noticed his goats became energetic after eating coffee berries.',
            question: 'Where did coffee originate?',
            answer: 'Ethiopia',
            technique: 'Scanning - Look for keywords "coffee" and "originated"'
          }
        ]
      },
      {
        id: 2,
        title: 'Understanding Academic Vocabulary',
        duration: '15 min',
        content: `
## Academic Word List

IELTS Reading uses formal, academic language. Expand your vocabulary!

### Common Academic Words:
- **analyze** - examine in detail
- **significant** - important, meaningful
- **demonstrate** - show, prove
- **implications** - consequences, effects
- **comprehensive** - complete, thorough
- **facilitate** - make easier
- **predominantly** - mainly, mostly

### Dealing with Unknown Words:
1. **Context clues** - What words surround it?
2. **Word parts** - Prefix (un-, re-), Root, Suffix (-tion, -ment)
3. **Skip and return** - Don't get stuck
4. **Eliminate options** - In MCQ, remove wrong answers

### Synonyms and Paraphrasing:
IELTS loves paraphrasing! The question uses different words than the text.

Example:
- Text: "substantial increase"
- Question: "significant growth"
        `
      }
    ]
  },
  
  writing: {
    title: 'Writing Skills Training',
    icon: '✍️',
    color: 'var(--writing-primary)',
    lessons: [
      {
        id: 1,
        title: 'Task 1: Data Description',
        duration: '20 min',
        content: `
## IELTS Writing Task 1 (150 words, 20 minutes)

Describe visual information: graphs, charts, diagrams, processes.

### Structure:
1. **Introduction** (1 sentence)
   - Paraphrase the question
   - "The graph illustrates..."

2. **Overview** (2 sentences)
   - Main trends or key features
   - "Overall, it can be seen that..."

3. **Body Paragraph 1** (3-4 sentences)
   - Detail main features
   - Use specific data

4. **Body Paragraph 2** (3-4 sentences)
   - Compare/contrast
   - Describe changes over time

### Useful Phrases:
**Describing trends:**
- increased dramatically
- decreased slightly
- remained stable
- fluctuated between X and Y

**Comparing:**
- In contrast...
- Similarly...
- Whereas X increased, Y declined...

**Highlighting data:**
- The figure stood at...
- reached a peak of...
- fell to a low of...

### Scoring Criteria:
1. Task Achievement (25%)
2. Coherence & Cohesion (25%)
3. Lexical Resource (25%)
4. Grammatical Range & Accuracy (25%)
        `
      },
      {
        id: 2,
        title: 'Task 2: Essay Writing',
        duration: '25 min',
        content: `
## IELTS Writing Task 2 (250 words, 40 minutes)

Respond to an argument, problem, or opinion.

### Essay Types:
1. **Opinion** - Do you agree/disagree?
2. **Discussion** - Discuss both views
3. **Problem/Solution** - What are causes and solutions?
4. **Advantages/Disadvantages** - Outweigh?

### Standard Structure:

**Introduction** (2-3 sentences)
- Paraphrase question
- State your position
- Outline main points

**Body Paragraph 1** (4-5 sentences)
- Topic sentence
- Explanation
- Example
- Link back to question

**Body Paragraph 2** (4-5 sentences)
- Alternative view or second main point
- Explanation
- Example
- Analysis

**Conclusion** (2 sentences)
- Summarize main points
- Restate position

### Time Management:
- Planning: 5 minutes
- Writing: 30 minutes
- Checking: 5 minutes

### Common Mistakes to Avoid:
❌ Too short (under 250 words)
❌ Off-topic
❌ Poor paragraphing
❌ Memorized phrases (examiners spot these!)
❌ Too informal language
        `
      }
    ]
  },
  
  speaking: {
    title: 'Speaking Skills Training',
    icon: '🎤',
    color: 'var(--speaking-primary)',
    lessons: [
      {
        id: 1,
        title: 'Part 1: Introduction and Interview',
        duration: '10 min',
        content: `
## Speaking Part 1 (4-5 minutes)

General questions about yourself, home, work, studies, interests.

### Strategy:
- Give EXTENDED answers (not just yes/no)
- Add reasons and examples
- Show range of grammar and vocabulary

### Example:
**Bad:** "Do you like music?" → "Yes."
**Good:** "Do you like music?" → "Yes, absolutely! I'm particularly fond of classical music because it helps me relax after a long day. I often listen to Beethoven when I'm studying."

### Common Topics:
- Hometown
- Work/Studies
- Hobbies
- Family
- Food
- Sports
- Technology

### Useful Phrases:
- "I'm really into..."
- "One thing I enjoy is..."
- "What I find interesting about X is..."
- "In my opinion..."
- "Generally speaking..."
        `
      },
      {
        id: 2,
        title: 'Part 2: Long Turn (Cue Card)',
        duration: '12 min',
        content: `
## Speaking Part 2 (3-4 minutes)

Speak for 2 minutes on a given topic. 1 minute preparation time.

### The Task Card Format:
"Describe a person who influenced you"
You should say:
- Who this person is
- How you know them
- What they did
- And explain why they influenced you

### Preparation (1 minute):
Make quick notes:
- WHO - write name/relationship
- WHAT - key actions
- WHY - impact on you
- WHEN - time period

### Speaking (2 minutes):
Follow the bullet points on the card. Speak continuously without long pauses.

### If You Run Out of Things to Say:
- Give examples
- Describe feelings
- Add details about when/where/how
- Compare past and present

### Timing:
Don't worry if examiner stops you at 2 minutes - this is normal!
If you finish early (under 1:30), you may lose points.
        `
      },
      {
        id: 3,
        title: 'Part 3: Discussion',
        duration: '15 min',
        content: `
## Speaking Part 3 (4-5 minutes)

Abstract discussion related to Part 2 topic. More difficult questions.

### Question Types:
- Comparing past and present
- Predicting future
- Advantages/disadvantages
- Causes and effects
- Solutions to problems

### Advanced Techniques:

**1. Buy Thinking Time:**
- "That's an interesting question..."
- "Well, let me think about that..."
- "I'd say that..."

**2. Structure Your Answer:**
- Main point
- Reason/example
- Contrast (however, although)
- Conclusion

**3. Show Range:**
Use complex sentences:
- "Although X is true, Y is also important because..."
- "Not only does X affect Y, but it also impacts Z..."
- "If we consider X, we can see that..."

**4. Give Balanced Views:**
- "On one hand... On the other hand..."
- "While some people believe X, others argue Y..."

### Advanced Vocabulary:
- contemporary society
- technological advancement
- environmental sustainability
- social implications
- economic factors
- cultural diversity

### What Examiners Look For:
✓ Fluency (speaking smoothly)
✓ Coherence (ideas connect logically)
✓ Vocabulary range
✓ Grammar complexity and accuracy
✓ Pronunciation clarity
        `
      }
    ]
  }
};

// Practice exercises for each lesson
export const practiceExercises = {
  listening: [
    {
      lessonId: 1,
      audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      questions: [
        { type: 'fill', question: 'The conversation is about ___' },
        { type: 'mcq', question: 'What is the speakers mood?', options: ['Angry', 'Happy', 'Neutral', 'Sad'] }
      ]
    }
  ],
  reading: [
    {
      lessonId: 1,
      passage: 'Short practice passage...',
      questions: [
        { type: 'tf', question: 'Practice statement' },
        { type: 'mcq', question: 'Practice question', options: ['A', 'B', 'C', 'D'] }
      ]
    }
  ]
};
