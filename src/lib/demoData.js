export const DEMO_BOOK_ID = 'demo-lantern-harbour';

export const DEMO_BOOKS = [
  {
    id: DEMO_BOOK_ID,
    owner_id: 'demo-teacher',
    title: 'The Lantern on the Harbour Wall',
    description:
      'A university English literature short story about Clara, an old harbour-keeper, and the quiet purpose of small lights in coastal fog.',
    pdf_url: '/demo/sample-story.pdf',
    audio_url: '/demo/sample-audio.wav',
    cover_front_url: '/demo/cover-front.png',
    cover_back_url: '/demo/cover-back.png',
    created_at: '2026-10-15T10:00:00.000Z',
    questions: [
      {
        id: 'demo-q1',
        book_id: DEMO_BOOK_ID,
        type: 'multiple_choice',
        question: 'Where does Clara first notice the small amber lantern?',
        options: [
          'Hanging halfway down the stone breakwater pier beside a rusted iron ring',
          'At the very top of the three-thousand-watt North Point lighthouse',
          'Inside the leaded windows of the university reading room',
          'Tied to the bow of an approaching fishing trawler',
        ],
        correct_index: 0,
        explanation:
          'In Chapter I, the narrator describes the small diamond of amber light hanging halfway down the pier beside a rusted iron ring.',
        position: 0,
      },
      {
        id: 'demo-q2',
        book_id: DEMO_BOOK_ID,
        type: 'multiple_choice',
        question: 'Why does the harbour-keeper say the lighthouse beam cannot help the rowboats near the seawall?',
        options: [
          'The lighthouse lamp is broken during October storms',
          'The tall beam passes fifty feet above the water below the bluff',
          'Rowboats are forbidden from entering Saltgate harbour at night',
          'The lighthouse only illuminates the town cobblestones',
        ],
        correct_index: 1,
        explanation:
          'In Chapter III, he explains that the lighthouse warns ships three miles out, while its tall beam sweeps fifty feet above the dark pocket of water beneath the bluff.',
        position: 1,
      },
      {
        id: 'demo-q3',
        book_id: DEMO_BOOK_ID,
        type: 'inference',
        question: 'What can be inferred about Clara’s view of literature from her notebook entry in Chapter IV?',
        options: [
          'She decides to abandon her university literature classes permanently',
          'She realizes subtle, humble details can carry deeper meaning than grand symbols',
          'She believes the town should replace all streetlights with oil lanterns',
          'She plans to buy a rowboat to visit the mussel beds herself',
        ],
        correct_index: 1,
        explanation:
          'Clara contrasts her semester essays on "grand metaphors and towering symbols" with the harbour-keeper’s "quiet precision," showing her newfound appreciation for modest, purposeful guidance.',
        position: 2,
      },
      {
        id: 'demo-q4',
        book_id: DEMO_BOOK_ID,
        type: 'inference',
        question: 'Why do the two fishermen and the harbour-keeper exchange no spoken words at the end?',
        options: [
          'They are strangers who speak different languages',
          'The ocean wind makes all communication impossible',
          'Their shared routine and the steady lantern light already convey mutual trust and guidance',
          'The harbour-keeper is angry that they returned so late',
        ],
        correct_index: 2,
        explanation:
          'The text states that "the lantern had already answered their unspoken question" and the keeper raises two fingers in quiet acknowledgement, implying longstanding familiarity and silent trust.',
        position: 3,
      },
    ],
  },
];
