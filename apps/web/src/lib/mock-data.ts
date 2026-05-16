// Mock data for Kyle's fitness bot dashboard
// Generated to simulate realistic lead data

export type Platform = 'instagram' | 'facebook';
export type LeadStatus = 'New' | 'Engaged' | 'Qualified' | 'Booked' | 'Closed' | 'Lost';
export type MessageRole = 'assistant' | 'user';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface Lead {
  user_id: string;
  first_name: string;
  platform: Platform;
  status: LeadStatus;
  messages: Message[];
  lastActivity: number;
  source: 'instagram_dm' | 'facebook_dm' | 'comment';
  funnelStep: 1 | 2 | 3 | 4 | 5 | 6;
}

const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

function makeMsg(role: MessageRole, content: string, hoursAgo: number): Message {
  return { role, content, timestamp: now - hoursAgo * hour };
}

export const mockLeads: Lead[] = [
  {
    user_id: 'ig_3821740192',
    first_name: 'Marcus',
    platform: 'instagram',
    status: 'Booked',
    funnelStep: 6,
    source: 'instagram_dm',
    lastActivity: now - 2 * hour,
    messages: [
      makeMsg('user', 'Hey I saw your post about fat loss for busy guys', 48),
      makeMsg('assistant', "Hey Marcus! 💪 I'm Kyle's AI. What's your main fitness goal right now?", 47),
      makeMsg('user', 'I need to lose about 30 lbs but I work 60 hours a week', 47),
      makeMsg('assistant', "That's a tough spot but totally fixable. Are you currently eating 3 meals a day or just grabbing whatever?", 46),
      makeMsg('user', 'Honestly mostly fast food and skipping breakfast', 46),
      makeMsg('assistant', "Got it. That's actually the #1 issue I see with guys in your position. How long have you been trying to lose the weight?", 45),
      makeMsg('user', 'Like 2 years on and off. Nothing sticks', 45),
      makeMsg('assistant', "2 years is a long time to be stuck. Kyle works specifically with busy professionals — he's helped 40+ guys in your exact situation drop 20-30 lbs without living in the gym. Want to see if you'd be a good fit for his coaching?", 44),
      makeMsg('user', 'Yeah actually I would', 44),
      makeMsg('assistant', `Here's the link to book a free strategy call with Kyle: https://calendly.com/kyle-briere-largedumbbells/30 — takes 30 min, he'll show you exactly what needs to change. Go ahead and grab a time that works!`, 43),
      makeMsg('user', 'Done! Booked for Thursday at 2pm', 43),
      makeMsg('assistant', 'Amazing Marcus! Kyle will see you then. Check your email for the confirmation. 🔥', 2),
    ]
  },
  {
    user_id: 'fb_7293018472',
    first_name: 'Tyler',
    platform: 'facebook',
    status: 'Engaged',
    funnelStep: 3,
    source: 'facebook_dm',
    lastActivity: now - 3 * hour,
    messages: [
      makeMsg('user', 'Interested in the program', 12),
      makeMsg('assistant', "Hey Tyler! 💪 What's your main goal — fat loss, muscle, or both?", 12),
      makeMsg('user', 'Fat loss mainly. I used to be in shape but gained weight after my divorce', 11),
      makeMsg('assistant', "Man, life events like that can really knock you off track. How much are you looking to lose?", 11),
      makeMsg('user', 'Probably 25 lbs', 11),
      makeMsg('assistant', "That's very achievable. What does your current eating look like — do you cook at home or mostly eating out?", 10),
      makeMsg('user', 'Mix of both. I\'m not great at cooking', 10),
      makeMsg('assistant', "No worries — Kyle's approach works even if you can't cook. What's your biggest obstacle right now, honestly?", 3),
    ]
  },
  {
    user_id: 'ig_9182736451',
    first_name: 'Jordan',
    platform: 'instagram',
    status: 'Booked',
    funnelStep: 6,
    source: 'comment',
    lastActivity: now - 6 * hour,
    messages: [
      makeMsg('user', 'GO', 72),
      makeMsg('assistant', "Hey Jordan! You replied GO — I'm Kyle's AI assistant. What fitness goal are you working toward?", 72),
      makeMsg('user', 'I want to build muscle. I\'m skinny fat', 71),
      makeMsg('assistant', "Skinny fat is actually one of the most common things Kyle fixes. Are you currently lifting at all, or starting from scratch?", 71),
      makeMsg('user', 'I go to the gym like twice a week but not consistently', 70),
      makeMsg('assistant', "That inconsistency is the key issue to fix. What's stopping you from going more — time, energy, or not knowing what to do?", 69),
      makeMsg('user', 'Honestly don\'t know what I\'m doing there', 69),
      makeMsg('assistant', "That makes total sense — going without a plan is frustrating and leads to zero results. Kyle's built personalized plans for over 100 guys. Want to hop on a quick call to see his approach?", 68),
      makeMsg('user', 'Yeah for sure', 68),
      makeMsg('assistant', `Book here: https://calendly.com/kyle-briere-largedumbbells/30 🔥`, 67),
      makeMsg('user', 'Booked!', 6),
    ]
  },
  {
    user_id: 'ig_5647382910',
    first_name: 'Devon',
    platform: 'instagram',
    status: 'Engaged',
    funnelStep: 2,
    source: 'instagram_dm',
    lastActivity: now - 3 * day,
    messages: [
      makeMsg('user', 'What\'s the cost of your program?', 72),
      makeMsg('assistant', "Hey Devon! Great question — the investment varies based on your specific situation. First, let me ask: what's the goal you're working toward?", 72),
      makeMsg('user', 'Lose weight', 71),
      makeMsg('assistant', "How much are you looking to lose, and how long have you been trying?", 71),
    ]
  },
  {
    user_id: 'fb_8374629103',
    first_name: 'Chris',
    platform: 'facebook',
    status: 'Booked',
    funnelStep: 6,
    source: 'facebook_dm',
    lastActivity: now - 8 * hour,
    messages: [
      makeMsg('user', 'I need help getting in shape for my wedding', 24),
      makeMsg('assistant', "Congrats Chris! When's the big day?", 24),
      makeMsg('user', '6 months out', 23),
      makeMsg('assistant', "6 months is perfect — totally doable to look great. What are you working with right now? Any gym routine or starting fresh?", 23),
      makeMsg('user', 'Starting fresh basically. Haven\'t worked out in 2 years', 22),
      makeMsg('assistant', "Good news is that muscle memory is on your side. Kyle loves working with motivated guys with a deadline. Want to get on a call and map out exactly what 6 months looks like for you?", 21),
      makeMsg('user', 'Let\'s do it', 20),
      makeMsg('assistant', `Here's the calendar: https://calendly.com/kyle-briere-largedumbbells/30`, 20),
      makeMsg('user', 'Scheduled!', 8),
    ]
  },
  {
    user_id: 'ig_2938471029',
    first_name: 'Nate',
    platform: 'instagram',
    status: 'New',
    funnelStep: 1,
    source: 'comment',
    lastActivity: now - 1 * hour,
    messages: [
      makeMsg('user', 'GO', 1),
      makeMsg('assistant', "Hey Nate! 👋 You just unlocked Kyle's free fitness guide. What's the #1 thing you want to change about your body right now?", 1),
    ]
  },
  {
    user_id: 'ig_6473829104',
    first_name: 'Alex',
    platform: 'instagram',
    status: 'Qualified',
    funnelStep: 4,
    source: 'instagram_dm',
    lastActivity: now - 5 * hour,
    messages: [
      makeMsg('user', 'I saw your transformation posts. I need something like that', 18),
      makeMsg('assistant', "Hey Alex! What transformation are you going for? Fat loss, muscle, or both?", 18),
      makeMsg('user', 'Fat loss first then muscle. I\'m about 40 lbs overweight', 17),
      makeMsg('assistant', "40 lbs is very doable with the right approach. How long have you been carrying that extra weight?", 17),
      makeMsg('user', 'Since COVID basically. 2020 hit me hard', 16),
      makeMsg('assistant', "You and about a million other guys lol. What's your diet like right now?", 15),
      makeMsg('user', 'Terrible honestly. I stress eat a lot', 15),
      makeMsg('assistant', "Stress eating is a pattern Kyle specifically addresses — it's not about willpower, it's about structure. Have you ever worked with a coach before?", 5),
    ]
  },
  {
    user_id: 'fb_3928471029',
    first_name: 'Mike',
    platform: 'facebook',
    status: 'Booked',
    funnelStep: 6,
    source: 'facebook_dm',
    lastActivity: now - 12 * hour,
    messages: [
      makeMsg('user', 'My doctor told me I need to lose weight. Looking for help', 36),
      makeMsg('assistant', "Hey Mike, that's a wake-up call worth taking seriously. What did the doctor say specifically — blood pressure, weight, diabetes risk?", 36),
      makeMsg('user', 'Blood pressure and pre-diabetic', 35),
      makeMsg('assistant', "Those are very fixable with the right approach. Kyle has helped several guys reverse pre-diabetes markers through his program. How much are you looking to lose?", 35),
      makeMsg('user', 'My doctor said 40-50 lbs', 34),
      makeMsg('assistant', "That's a meaningful goal and completely achievable. Kyle would be able to build around your medical situation. Want to get on a call — he'll give you a real plan, not just generic advice?", 33),
      makeMsg('user', 'Yes please', 33),
      makeMsg('assistant', `Calendar link: https://calendly.com/kyle-briere-largedumbbells/30`, 32),
      makeMsg('user', 'Just booked', 12),
    ]
  },
  {
    user_id: 'ig_1029384756',
    first_name: 'Ryan',
    platform: 'instagram',
    status: 'Engaged',
    funnelStep: 3,
    source: 'instagram_dm',
    lastActivity: now - 5 * day,
    messages: [
      makeMsg('user', 'How does the program work?', 120),
      makeMsg('assistant', "Hey Ryan! Kyle's program is personalized — it starts with understanding your specific situation. What's your main goal?", 120),
      makeMsg('user', 'Build muscle and get stronger', 119),
      makeMsg('assistant', "How long have you been lifting? And what does your current routine look like?", 119),
      makeMsg('user', 'About a year. I do PPL but feel like I\'m not progressing', 118),
      makeMsg('assistant', "Plateau after a year is super common — usually a programming or nutrition issue. Are you tracking your food at all?", 117),
    ]
  },
  {
    user_id: 'fb_5647382901',
    first_name: 'Carlos',
    platform: 'facebook',
    status: 'Qualified',
    funnelStep: 5,
    source: 'comment',
    lastActivity: now - 4 * hour,
    messages: [
      makeMsg('user', 'I want to work with Kyle', 24),
      makeMsg('assistant', "Hey Carlos! 💪 What's the goal you're working toward?", 24),
      makeMsg('user', 'I\'m 48 and want to get back in shape. Feeling old', 23),
      makeMsg('assistant', "48 is the new 28 with the right program. Kyle works with a lot of guys 40+ who are transforming. What does \"back in shape\" look like to you?", 23),
      makeMsg('user', 'Lose 20 lbs, feel energetic, be able to keep up with my kids', 22),
      makeMsg('assistant', "That's a powerful why. Energy and keeping up with your kids — that's what actually matters. What's been stopping you from making this change?", 21),
      makeMsg('user', 'Tried diets before they never work long term. And I travel for work', 21),
      makeMsg('assistant', "Travel is actually where Kyle's program shines — it's built around real life. What days do you typically travel?", 4),
    ]
  },
  {
    user_id: 'ig_8374920183',
    first_name: 'Sean',
    platform: 'instagram',
    status: 'Booked',
    funnelStep: 6,
    source: 'instagram_dm',
    lastActivity: now - 30 * hour,
    messages: [
      makeMsg('user', 'Interested in working with kyle', 72),
      makeMsg('assistant', "Hey Sean! What's your main fitness goal?", 72),
      makeMsg('user', 'Get lean for summer. I\'m about 20 lbs over', 71),
      makeMsg('assistant', "Summer deadline is great motivation. How far out are you?", 71),
      makeMsg('user', '4 months', 70),
      makeMsg('assistant', "4 months, 20 lbs — very realistic. Have you tried cutting before or is this new territory?", 70),
      makeMsg('user', 'Tried keto for 2 months lost some then gained it back', 69),
      makeMsg('assistant', "Classic keto rebound — it's not a sustainable approach for most guys. Kyle's method is different. Want to see exactly what he'd recommend for your situation?", 68),
      makeMsg('user', 'Yeah book me', 68),
      makeMsg('assistant', `Here's Kyle's calendar: https://calendly.com/kyle-briere-largedumbbells/30`, 67),
      makeMsg('user', 'Done thanks', 30),
    ]
  },
  {
    user_id: 'fb_2938471820',
    first_name: 'James',
    platform: 'facebook',
    status: 'New',
    funnelStep: 1,
    source: 'facebook_dm',
    lastActivity: now - 2 * hour,
    messages: [
      makeMsg('user', 'Hey saw the ad', 2),
      makeMsg('assistant', "Hey James! 👋 What fitness goal are you working toward right now?", 2),
    ]
  },
  {
    user_id: 'ig_7463829104',
    first_name: 'Ethan',
    platform: 'instagram',
    status: 'Booked',
    funnelStep: 6,
    source: 'instagram_dm',
    lastActivity: now - 4 * day,
    messages: [
      makeMsg('user', 'I need accountability. I keep starting and stopping', 96),
      makeMsg('assistant', "Hey Ethan! The start-stop cycle is brutal. What typically causes you to stop — life gets busy, motivation dies, or something else?", 96),
      makeMsg('user', 'Motivation. I do great for 2 weeks then just stop caring', 95),
      makeMsg('assistant', "That's not a willpower problem — it's a system problem. Kyle builds accountability directly into his program. How long have you been dealing with this cycle?", 95),
      makeMsg('user', 'Years honestly. I really want to change for real this time', 94),
      makeMsg('assistant', "That desire to break the cycle is exactly what Kyle works with. Let's get you on a call with him — he's worked with a lot of guys in this exact spot. Here's his calendar: https://calendly.com/kyle-briere-largedumbbells/30", 93),
      makeMsg('user', 'Booked', 4 * 24),
    ]
  },
  {
    user_id: 'fb_1928374650',
    first_name: 'Brandon',
    platform: 'facebook',
    status: 'Engaged',
    funnelStep: 2,
    source: 'facebook_dm',
    lastActivity: now - 6 * hour,
    messages: [
      makeMsg('user', 'What results can I expect?', 8),
      makeMsg('assistant', "Hey Brandon! Results really depend on where you're starting and your consistency. What's your current situation — how much are you looking to lose or gain?", 8),
      makeMsg('user', 'Want to lose 35 lbs', 7),
      makeMsg('assistant', "35 lbs is a solid goal. How quickly are you hoping to get there?", 6),
    ]
  },
  {
    user_id: 'ig_3847291038',
    first_name: 'Kyle W',
    platform: 'instagram',
    status: 'Booked',
    funnelStep: 6,
    source: 'comment',
    lastActivity: now - 2 * day,
    messages: [
      makeMsg('user', 'GO', 60),
      makeMsg('assistant', "Hey Kyle! 💪 What's your main fitness goal?", 60),
      makeMsg('user', 'Fat loss and looking better overall. Got a reunion in 3 months', 59),
      makeMsg('assistant', "3-month reunion deadline — that's real motivation. How much are you looking to lose?", 59),
      makeMsg('user', 'Like 15-20 lbs', 58),
      makeMsg('assistant', "Totally doable in 3 months if you dial things in now. What's your biggest struggle — nutrition, exercise, or staying consistent?", 57),
      makeMsg('user', 'Nutrition for sure. I can exercise but I eat like crap', 57),
      makeMsg('assistant', "Nutrition is 80% of the result anyway, so fixing that is the move. Kyle has a simple framework for guys who eat out a lot. Want to talk with him directly?", 56),
      makeMsg('user', 'Yes', 55),
      makeMsg('assistant', `Schedule here: https://calendly.com/kyle-briere-largedumbbells/30`, 54),
      makeMsg('user', 'Locked in', 48),
    ]
  },
  {
    user_id: 'fb_9283746510',
    first_name: 'Antonio',
    platform: 'facebook',
    status: 'Qualified',
    funnelStep: 4,
    source: 'instagram_dm',
    lastActivity: now - 7 * day,
    messages: [
      makeMsg('user', 'How much does it cost', 168),
      makeMsg('assistant', "Hey Antonio! The investment varies based on what you need. To give you the right info, what's your main goal?", 168),
      makeMsg('user', 'Lose weight build some muscle', 167),
      makeMsg('assistant', "Great combo goal. How much weight are we talking?", 166),
      makeMsg('user', 'Maybe 25 lbs', 166),
      makeMsg('assistant', "Got it. What's your timeline feeling like?", 165),
      makeMsg('user', '6 months ideally', 165),
      makeMsg('assistant', "That's a realistic pace. The investment depends on the level of coaching — Kyle does everything from group programs to 1-on-1. A 30-min call with him would help figure out the best fit. Worth your time?", 164),
    ]
  },
];

// Generate additional leads to hit ~47 total
const additionalFirstNames = [
  'Derek', 'Victor', 'Jason', 'Kevin', 'Patrick', 'Robert', 'Daniel', 'Steven',
  'Andrew', 'Joseph', 'Thomas', 'Charles', 'William', 'David', 'Richard',
  'Matthew', 'Anthony', 'Mark', 'Donald', 'Paul', 'George', 'Kenneth',
  'Edward', 'Brian', 'Ronald', 'Timothy', 'Gary', 'Larry', 'Jeffrey', 'Frank'
];

const statuses: LeadStatus[] = ['New', 'Engaged', 'Qualified', 'Booked'];
const platforms: Platform[] = ['instagram', 'facebook'];
const sources: Lead['source'][] = ['instagram_dm', 'facebook_dm', 'comment'];
const funnelSteps: Lead['funnelStep'][] = [1, 2, 3, 4, 5, 6];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

for (let i = 0; i < 31; i++) {
  const r = (offset: number) => seededRandom(i * 17 + offset);
  const statusIdx = Math.floor(r(1) * statuses.length);
  const platformIdx = Math.floor(r(2) * platforms.length);
  const sourceIdx = Math.floor(r(3) * sources.length);
  const funnelIdx = Math.floor(r(4) * funnelSteps.length);
  const hoursAgo = Math.floor(r(5) * 7 * 24);
  const msgCount = Math.floor(r(6) * 6) + 2;

  const status = statuses[statusIdx];
  const platform = platforms[platformIdx];

  const msgs: Message[] = [
    makeMsg('user', 'Hey interested in your program', hoursAgo + msgCount),
    makeMsg('assistant', "Hey! What's your main fitness goal?", hoursAgo + msgCount - 1),
  ];
  for (let j = 1; j < msgCount - 1; j++) {
    msgs.push(makeMsg(j % 2 === 0 ? 'user' : 'assistant',
      j % 2 === 0 ? 'Looking to lose weight and get in shape' : 'Tell me more about your current routine',
      hoursAgo + msgCount - j - 1));
  }
  if (status === 'Booked') {
    msgs.push(makeMsg('assistant', `Book your call here: https://calendly.com/kyle-briere-largedumbbells/30`, hoursAgo));
  }

  mockLeads.push({
    user_id: `${platform === 'instagram' ? 'ig' : 'fb'}_${Math.floor(r(7) * 9000000000) + 1000000000}`,
    first_name: additionalFirstNames[i] || `Lead${i}`,
    platform,
    status,
    funnelStep: funnelSteps[funnelIdx],
    source: sources[sourceIdx],
    lastActivity: now - hoursAgo * hour,
    messages: msgs,
  });
}

// Stats derived from mock data
export const mockStats = {
  totalLeads: mockLeads.length,
  activeToday: mockLeads.filter(l => l.lastActivity > now - 24 * hour).length,
  callsBooked: mockLeads.filter(l => l.status === 'Booked').length,
  get conversionRate() {
    return ((this.callsBooked / this.totalLeads) * 100).toFixed(1);
  }
};

// Weekly lead volume data (last 7 days)
export const weeklyLeadData = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(now - (6 - i) * day);
  const label = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dayStart = now - (6 - i) * day;
  const dayEnd = dayStart + day;
  const leads = mockLeads.filter(l => l.lastActivity >= dayStart && l.lastActivity < dayEnd).length;
  const messages = mockLeads
    .filter(l => l.messages.some(m => m.timestamp >= dayStart && m.timestamp < dayEnd))
    .reduce((acc, l) => acc + l.messages.filter(m => m.timestamp >= dayStart && m.timestamp < dayEnd).length, 0);
  return { day: label, leads: leads || Math.floor(Math.random() * 8) + 1, messages: messages || Math.floor(Math.random() * 20) + 5 };
});

// Platform breakdown
export const platformData = [
  {
    platform: 'instagram',
    count: mockLeads.filter(l => l.platform === 'instagram').length,
    fill: 'var(--color-instagram)'
  },
  {
    platform: 'facebook',
    count: mockLeads.filter(l => l.platform === 'facebook').length,
    fill: 'var(--color-facebook)'
  }
];

// Funnel data
export const funnelData = [
  { step: 'New Leads', count: mockLeads.filter(l => l.status === 'New').length },
  { step: 'Engaged', count: mockLeads.filter(l => l.status === 'Engaged').length },
  { step: 'Qualified', count: mockLeads.filter(l => l.status === 'Qualified').length },
  { step: 'Call Booked', count: mockLeads.filter(l => l.status === 'Booked').length },
];

// Source breakdown
export const sourceData = [
  { source: 'Instagram DM', count: mockLeads.filter(l => l.source === 'instagram_dm').length, fill: 'var(--color-instagram)' },
  { source: 'Facebook DM', count: mockLeads.filter(l => l.source === 'facebook_dm').length, fill: 'var(--color-facebook)' },
  { source: 'Comment Trigger', count: mockLeads.filter(l => l.source === 'comment').length, fill: 'var(--color-comment)' },
];

// Weekly performance table
export const weeklyPerformance = Array.from({ length: 6 }, (_, i) => {
  const weekNum = 6 - i;
  const newLeads = Math.floor(seededRandom(i * 3 + 1) * 8) + 4;
  const qualified = Math.floor(newLeads * (0.4 + seededRandom(i * 3 + 2) * 0.3));
  const booked = Math.floor(qualified * (0.3 + seededRandom(i * 3 + 3) * 0.3));
  const d = new Date(now - weekNum * 7 * day);
  return {
    week: `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    newLeads,
    qualified,
    booked,
    conversionRate: `${((booked / newLeads) * 100).toFixed(1)}%`
  };
}).reverse();
