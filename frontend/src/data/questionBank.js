// Large question bank for dynamic test generation
// Each test randomly selects questions from these pools

export const listeningQuestionBank = [
  {
    category: 'accommodation',
    audioUrl: 'https://www.youtube.com/watch?v=uRKeeelqWxw',
    transcript: `Agent: Good morning, City Apartments. How can I help you?
Student: Hi, I'm looking for a flat to rent near the university. I'm starting my course in September.
Agent: Okay, let me check what we have available. What's your budget?
Student: Around £800 per month, including bills if possible.
Agent: Alright. I have a nice two-bedroom flat on Park Street, number 42, available from September 1st. It's £750 per month plus bills.
Student: That sounds good. How far is it from the university?
Agent: About a 15-minute walk, or you can take bus number 23 which runs every 10 minutes.
Student: Perfect. What about facilities? Does it have internet?
Agent: Yes, high-speed WiFi is included. There's also a shared laundry room in the basement.
Student: Excellent. And parking?
Agent: There's street parking available, but you'll need to get a resident's permit from the council. That costs about £120 per year.
Student: I see. When can I view it?
Agent: How about this Thursday at 2:30 PM?
Student: Thursday works for me. Can you send me the address and details by email?
Agent: Of course. What's your email address?
Student: It's sarah.mitchell@email.com
Agent: Got it. I'll send that over today. See you Thursday!`,
    questions: [
      { type: 'fill', question: 'The student is looking for accommodation near the ___', difficulty: 'easy' },
      { type: 'fill', question: 'The monthly rent for the flat is £___', difficulty: 'easy' },
      { type: 'fill', question: 'The flat is located on ___ Street', difficulty: 'medium' },
      { type: 'fill', question: 'The flat number is ___', difficulty: 'medium' },
      { type: 'fill', question: 'Bus number ___ goes to the university', difficulty: 'medium' },
      { type: 'fill', question: 'The viewing is scheduled for ___ (day)', difficulty: 'easy' },
      { type: 'fill', question: 'The viewing time is at ___', difficulty: 'easy' },
      { type: 'fill', question: 'The student email is ___', difficulty: 'hard' },
      { type: 'mcq', question: 'What is included in the rent?', options: ['WiFi', 'Parking', 'Food', 'Furniture'], difficulty: 'easy' },
      { type: 'mcq', question: 'Where is the laundry room?', options: ['Basement', 'Ground floor', 'First floor', 'Outside'], difficulty: 'medium' },
      { type: 'mcq', question: 'How long is the walk to university?', options: ['10 minutes', '15 minutes', '20 minutes', '30 minutes'], difficulty: 'easy' },
      { type: 'mcq', question: 'How much is the parking permit per year?', options: ['£100', '£120', '£150', '£200'], difficulty: 'hard' }
    ]
  },
  {
    category: 'campus_tour',
    audioUrl: 'https://www.youtube.com/watch?v=tbnzAVRZ9Xc',
    transcript: `Welcome to Riverside University. I'm David, and I'll be your tour guide today. We'll start at the main library, which is the tallest building on campus with 8 floors. It's open 24 hours during exam periods. Next to it is the Student Union building where you can find cafes, shops, and the student support office on the second floor. The medical center is located in Building C, near the sports complex. If you need to see a doctor, appointments can be booked online or by calling extension 5542. The sports facilities include an Olympic-size swimming pool, a fully-equipped gym, and tennis courts. Membership for students costs £45 per term. The science laboratories are in the east wing, and the arts studios are in the west wing. All buildings are connected by covered walkways, so you can get around easily in bad weather.`,
    questions: [
      { type: 'fill', question: 'The tour guide name is ___', difficulty: 'easy' },
      { type: 'fill', question: 'The main library has ___ floors', difficulty: 'easy' },
      { type: 'fill', question: 'The student support office is on the ___ floor', difficulty: 'medium' },
      { type: 'fill', question: 'To book a medical appointment call extension ___', difficulty: 'hard' },
      { type: 'fill', question: 'Sports membership costs £___ per term', difficulty: 'medium' },
      { type: 'mcq', question: 'When is the library open 24 hours?', options: ['Always', 'During exams', 'Weekends', 'Never'], difficulty: 'easy' },
      { type: 'mcq', question: 'Where is the medical center?', options: ['Building A', 'Building B', 'Building C', 'Building D'], difficulty: 'medium' },
      { type: 'mcq', question: 'What size is the swimming pool?', options: ['Standard', 'Olympic', 'Small', 'Large'], difficulty: 'easy' },
      { type: 'mcq', question: 'Where are the science laboratories?', options: ['East wing', 'West wing', 'North wing', 'South wing'], difficulty: 'medium' },
      { type: 'mcq', question: 'What connects all buildings?', options: ['Tunnels', 'Bridges', 'Covered walkways', 'Underground passages'], difficulty: 'hard' }
    ]
  }
];

export const readingQuestionBank = [
  {
    category: 'history',
    difficulty: 'medium',
    title: 'The History of Coffee',
    content: `Coffee is one of the world's most popular beverages, with over 2.25 billion cups consumed daily. The coffee plant, Coffea, originated in Ethiopia, where legend says a goat herder named Kaldi discovered it around 850 AD after noticing his goats became energetic after eating the berries.

From Ethiopia, coffee spread to the Arabian Peninsula. By the 15th century, coffee was being grown in Yemen, and Sufi monks drank it to stay awake during long prayer sessions. Coffee houses, called qahveh khaneh, appeared in cities across the Middle East and became important social centers.

European travelers brought stories of the exotic "wine of Araby" back home. Coffee arrived in Venice in 1615, and despite some religious controversy, Pope Clement VIII gave it his blessing. The first European coffee house opened in Oxford, England, in 1650, followed by London establishments that became known as "penny universities" because for a penny, one could buy a cup of coffee and engage in stimulating conversation.

The Dutch began cultivating coffee in their colonies in Indonesia in the 1600s. The French brought coffee to the Caribbean, while the Spanish took it to Central and South America. Brazil, now the world's largest coffee producer, began production in the 1720s.

The coffee industry has evolved dramatically. Instant coffee was invented in 1901 by Japanese scientist Satori Kato. The espresso machine was developed in Italy in 1884. Today, specialty coffee shops and artisan roasting have created a "third wave" of coffee culture, emphasizing bean quality, sustainable farming, and skilled preparation methods.`,
    questions: [
      { type: 'tf', question: 'Coffee originated in Yemen', difficulty: 'medium' },
      { type: 'tf', question: 'Kaldi was a goat herder', difficulty: 'easy' },
      { type: 'tf', question: 'The first European coffee house was in London', difficulty: 'medium' },
      { type: 'tf', question: 'Instant coffee was invented in the 20th century', difficulty: 'easy' },
      { type: 'mcq', question: 'How many cups of coffee are consumed daily worldwide?', options: ['1 billion', '2.25 billion', '3 billion', '5 billion'], difficulty: 'medium' },
      { type: 'mcq', question: 'Who discovered coffee according to legend?', options: ['Kaldi', 'Pope Clement', 'Satori Kato', 'A Sufi monk'], difficulty: 'easy' },
      { type: 'mcq', question: 'When did coffee arrive in Venice?', options: ['1615', '1650', '1720', '1884'], difficulty: 'hard' },
      { type: 'mcq', question: 'What were London coffee houses called?', options: ['Qahveh khaneh', 'Penny universities', 'Coffee clubs', 'Social centers'], difficulty: 'medium' },
      { type: 'fill', question: 'The largest coffee producer in the world is ___', difficulty: 'easy' },
      { type: 'fill', question: 'The espresso machine was developed in ___', difficulty: 'medium' },
      { type: 'mcq', question: 'Who invented instant coffee?', options: ['Italian inventor', 'Satori Kato', 'Dutch trader', 'Brazilian farmer'], difficulty: 'hard' },
      { type: 'fill', question: 'Sufi monks drank coffee during ___ sessions', difficulty: 'medium' },
      { type: 'tf', question: 'The Dutch cultivated coffee in Indonesia', difficulty: 'easy' }
    ]
  }
];

// Function to randomly select questions for a test
export function generateDynamicTest(questionBank, numberOfQuestions) {
  const allQuestions = [];
  
  // Flatten all questions from different categories
  questionBank.forEach((category, categoryIndex) => {
    category.questions.forEach((q, qIndex) => {
      allQuestions.push({
        ...q,
        id: `${categoryIndex}-${qIndex}`,
        categoryData: {
          audioUrl: category.audioUrl,
          transcript: category.transcript,
          title: category.title,
          content: category.content
        }
      });
    });
  });
  
  // Keep questions in proper order (no shuffling)
  // Select the required number sequentially
  return allQuestions.slice(0, numberOfQuestions);
}
