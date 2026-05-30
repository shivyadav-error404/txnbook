import { Friend, Transaction } from '../types';

export const INITIAL_FRIENDS: Friend[] = [
  {
    id: 'friend_shiv',
    name: 'Shiv',
    balance: 12500,
    lastUpdate: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastActivityText: 'Rent transaction added',
    phone: '+91 98765 43210',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: 'friend_amit_sharma_1',
    name: 'Amit Sharma',
    balance: 1200,
    lastUpdate: new Date().toISOString(),
    lastActivityText: 'Split lunch',
    phone: '+91 91234 56789',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: 'friend_amit_kaplas',
    name: 'Amit Kaplas',
    balance: 1200,
    lastUpdate: new Date().toISOString(),
    lastActivityText: 'Coffee outing',
    phone: '+91 92345 67890',
    avatarUrl: '' // AK initials
  },
  {
    id: 'friend_amit_sharma_2',
    name: 'Amit Sharma',
    balance: -500,
    lastUpdate: new Date().toISOString(),
    lastActivityText: 'Settled bill',
    phone: '+91 93456 78901',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: 'friend_amit_manate',
    name: 'Amit Manate',
    balance: 400,
    lastUpdate: new Date().toISOString(),
    lastActivityText: 'Travel share',
    phone: '+91 94567 89012',
    avatarUrl: '' // AM initials
  },
  {
    id: 'friend_mani_makha',
    name: 'Mani Makha',
    balance: -500,
    lastUpdate: new Date().toISOString(),
    lastActivityText: 'Shared online payment',
    phone: '+91 95678 90123',
    avatarUrl: '' // MM initials
  },
  {
    id: 'friend_rahul_verma',
    name: 'Rahul Verma',
    balance: 3000,
    lastUpdate: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastActivityText: 'Weekend trip',
    phone: '+91 96789 01234',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: 'friend_priya_singh',
    name: 'Priya Singh',
    balance: -1500,
    lastUpdate: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastActivityText: 'Movie ticket back',
    phone: '+91 97890 12345',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Shiv's history matching Screen 2
  {
    id: 'tx_shiv_1',
    friendId: 'friend_shiv',
    type: 'gave',
    amount: 1500,
    category: 'Lunch', // Dinner (Yesterday)
    note: 'Dinner (Yesterday)',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    paymentMode: 'Online'
  },
  {
    id: 'tx_shiv_2',
    friendId: 'friend_shiv',
    type: 'got',
    amount: 500,
    category: 'Coffee', // Movie (Sat)
    note: 'Movie (Sat)',
    date: new Date(Date.now() - 86400000 * 2).toISOString(), // Sat
    paymentMode: 'Online'
  },
  {
    id: 'tx_shiv_3',
    friendId: 'friend_shiv',
    type: 'gave',
    amount: 10000,
    category: 'Rent', // Rent (1st May)
    note: 'Rent (1st May)',
    date: '2026-05-01T12:00:00Z',
    paymentMode: 'Online'
  },
  // Other friends
  {
    id: 'tx_amit_sharma_1',
    friendId: 'friend_amit_sharma_1',
    type: 'gave',
    amount: 1200,
    category: 'Lunch',
    note: 'Lunch at Bistro',
    date: new Date().toISOString(),
    paymentMode: 'Online'
  },
  {
    id: 'tx_amit_kaplas_1',
    friendId: 'friend_amit_kaplas',
    type: 'gave',
    amount: 1200,
    category: 'Coffee',
    note: 'Costa Coffee shared cup',
    date: new Date().toISOString(),
    paymentMode: 'Cash'
  },
  {
    id: 'tx_amit_sharma_2',
    friendId: 'friend_amit_sharma_2',
    type: 'got',
    amount: 500,
    category: 'Coffee',
    note: 'Settled tea bill',
    date: new Date().toISOString(),
    paymentMode: 'Cash'
  },
  {
    id: 'tx_amit_manate_1',
    friendId: 'friend_amit_manate',
    type: 'gave',
    amount: 400,
    category: 'Travel',
    note: 'Uber auto split',
    date: new Date().toISOString(),
    paymentMode: 'Online'
  },
  {
    id: 'tx_mani_makha_1',
    friendId: 'friend_mani_makha',
    type: 'got',
    amount: 500,
    category: 'Shared Expense',
    note: 'Grocery bill split',
    date: new Date().toISOString(),
    paymentMode: 'Online'
  },
  {
    id: 'tx_rahul_1',
    friendId: 'friend_rahul_verma',
    type: 'gave',
    amount: 3000,
    category: 'Rent',
    note: 'Hotel stay booking split',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    paymentMode: 'Online'
  },
  {
    id: 'tx_priya_1',
    friendId: 'friend_priya_singh',
    type: 'got',
    amount: 1500,
    category: 'Gift',
    note: 'Birthday cake shared contribution',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    paymentMode: 'Credit'
  }
];

export const CATEGORIES = [
  'Lunch',
  'Travel',
  'Gift',
  'Coffee',
  'Shared Expense',
  'Rent',
  'Salary',
  'Grocery',
  'Shopping',
  'Other'
];

export const PAYMENT_MODES = ['Cash', 'Online', 'Credit'] as const;
