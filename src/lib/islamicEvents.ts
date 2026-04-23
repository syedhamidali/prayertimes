export type EventType = 'martyrdom' | 'wiladat' | 'victory' | 'other';

export interface IslamicEvent {
  month: number;
  day: number;
  name: string;
  type: EventType;
}

function classifyEvent(name: string, color: string): EventType {
  if (color === '0xFF277E3E') return 'wiladat';
  if (color === '0xFFFBBC04') return 'victory';
  if (name.toLowerCase().includes('martyrdom') || name.toLowerCase().includes('wafat')) return 'martyrdom';
  return 'martyrdom'; // red default
}

// Sourced from SIA ToolKit's important_event_dates database
export const ISLAMIC_EVENTS: IslamicEvent[] = [
  { month: 1, day: 1, name: 'Beginning of new Islamic year', type: 'other' },
  { month: 1, day: 2, name: 'Imam Husayn (as) reached Karbala', type: 'martyrdom' },
  { month: 1, day: 5, name: 'Ziarat: H. Aun & Mohammad (as)', type: 'martyrdom' },
  { month: 1, day: 6, name: 'Ziarat: H. Ali Akbar (as)', type: 'martyrdom' },
  { month: 1, day: 7, name: 'Ziarat: H. Qasim (as)', type: 'martyrdom' },
  { month: 1, day: 8, name: 'Ziarat: H. Abbas Alamdar (as)', type: 'martyrdom' },
  { month: 1, day: 9, name: 'Night of Ashura / Ziarat: H. Ali Asghar (as)', type: 'martyrdom' },
  { month: 1, day: 10, name: 'Ashura: Martyrdom of Imam al-Husayn (as)', type: 'martyrdom' },
  { month: 1, day: 12, name: 'Soyem Shuhada-e-Karbala', type: 'martyrdom' },
  { month: 1, day: 25, name: 'Martyrdom: Imam Zayn al-Abidin (as)', type: 'martyrdom' },
  { month: 1, day: 27, name: 'Martyrdom: H. Maytham al-Tammar (as)', type: 'martyrdom' },
  { month: 2, day: 1, name: 'Ahle-Haram entered palace of Yazid (l)', type: 'martyrdom' },
  { month: 2, day: 7, name: 'Wiladat: Imam Moosa Kazim (as)', type: 'wiladat' },
  { month: 2, day: 9, name: 'Victory in Battle of Naharwan', type: 'victory' },
  { month: 2, day: 13, name: 'Martyrdom: Syeda Sakina bint Hussain (as)', type: 'martyrdom' },
  { month: 2, day: 17, name: 'Martyrdom: Imam Ali Reza (as)', type: 'martyrdom' },
  { month: 2, day: 20, name: 'Arbaeen Shuhada-e-Karbala', type: 'martyrdom' },
  { month: 2, day: 24, name: 'Martyrdom: Syeda Zaynab bint Ali (sa)', type: 'martyrdom' },
  { month: 2, day: 28, name: 'Wafat: Prophet Muhammad (s)', type: 'martyrdom' },
  { month: 3, day: 4, name: 'Wafat: Masooma Qum (sa)', type: 'martyrdom' },
  { month: 3, day: 8, name: 'Martyrdom: Imam Hasan Askari (as)', type: 'martyrdom' },
  { month: 3, day: 9, name: 'Eid-e-Zehra (sa)', type: 'wiladat' },
  { month: 3, day: 17, name: 'Wiladat: Prophet Mohammad (s) & Imam Jafar al-Sadiq (as)', type: 'wiladat' },
  { month: 3, day: 18, name: 'Wiladat: Syeda Umm Kulthum bint Ali (sa)', type: 'wiladat' },
  { month: 4, day: 10, name: 'Wiladat: Imam Hassan Askari (as)', type: 'wiladat' },
  { month: 5, day: 13, name: 'Martyrdom: Syeda Fatima Zahra (sa)', type: 'martyrdom' },
  { month: 5, day: 15, name: 'Wiladat: Imam Zayn al-Abidin (as)', type: 'wiladat' },
  { month: 6, day: 3, name: 'Martyrdom: Syeda Fatima Zahra (sa)', type: 'martyrdom' },
  { month: 6, day: 10, name: 'Victory in Battle of Jamal', type: 'victory' },
  { month: 6, day: 20, name: 'Wiladat: Syeda Fatima Zahra (sa)', type: 'wiladat' },
  { month: 7, day: 1, name: 'Wiladat: Muhammad al-Baqir (as)', type: 'wiladat' },
  { month: 7, day: 3, name: 'Martyrdom: Imam Ali al-Naqi al-Hadi (as)', type: 'martyrdom' },
  { month: 7, day: 5, name: 'Wiladat: Imam Ali al-Naqi al-Hadi (as)', type: 'wiladat' },
  { month: 7, day: 9, name: 'Wiladat: H. Ali Asghar ibn Imam Hussain (as)', type: 'wiladat' },
  { month: 7, day: 10, name: 'Wiladat: Imam Muhammad al-Taqi al-Jawad (as)', type: 'wiladat' },
  { month: 7, day: 13, name: 'Wiladat: Imam Ali ibn Abi Talib (as)', type: 'wiladat' },
  { month: 7, day: 15, name: 'Martyrdom: Syeda Zaynab bint Ali (sa)', type: 'martyrdom' },
  { month: 7, day: 22, name: 'Niaz Imam Jafar al-Sadiq (as)', type: 'victory' },
  { month: 7, day: 24, name: 'Victory in Battle of Khaybar', type: 'victory' },
  { month: 7, day: 25, name: 'Martyrdom: Imam Musa al-Kazim (as)', type: 'martyrdom' },
  { month: 7, day: 26, name: 'Wafat: H. Abu Talib (as)', type: 'martyrdom' },
  { month: 7, day: 27, name: 'Night of Baysat and Meraj', type: 'victory' },
  { month: 7, day: 28, name: 'Imam Hussain journey from Madina to Karbala', type: 'martyrdom' },
  { month: 8, day: 1, name: 'Wiladat: Syeda Zaynab bint Ali (sa)', type: 'wiladat' },
  { month: 8, day: 2, name: 'Fasting in Ramzan was made compulsory', type: 'victory' },
  { month: 8, day: 3, name: 'Wiladat: Imam Husayn ibn Ali (as)', type: 'wiladat' },
  { month: 8, day: 4, name: 'Wiladat: H. Abbas ibn Ali (as)', type: 'wiladat' },
  { month: 8, day: 5, name: 'Lady Fizza (sa)', type: 'wiladat' },
  { month: 8, day: 7, name: 'Wiladat: H. Qasim ibn Imam Hasan (as)', type: 'wiladat' },
  { month: 8, day: 11, name: 'Wiladat: H. Ali Akbar ibn Imam Husayn (as)', type: 'wiladat' },
  { month: 8, day: 14, name: 'Shab-e-Barat', type: 'victory' },
  { month: 8, day: 15, name: 'Wiladat: Imam al-Mahdi (atfj)', type: 'wiladat' },
  { month: 9, day: 6, name: 'Torah was revealed', type: 'victory' },
  { month: 9, day: 10, name: 'Wafat: H. Khadija (sa)', type: 'martyrdom' },
  { month: 9, day: 12, name: 'Bible was revealed', type: 'victory' },
  { month: 9, day: 15, name: 'Wiladat: Imam al-Hasan ibn Ali (as)', type: 'wiladat' },
  { month: 9, day: 17, name: 'Victory in Battle of Badr', type: 'victory' },
  { month: 9, day: 18, name: 'Zabur was revealed', type: 'victory' },
  { month: 9, day: 19, name: 'Shab-e-Zarbat: Night of attack on Imam Ali (as)', type: 'martyrdom' },
  { month: 9, day: 21, name: 'Martyrdom: Imam Ali ibn Abi Talib (as)', type: 'martyrdom' },
  { month: 9, day: 22, name: 'Laylat-ul Qadr: Quran was revealed', type: 'victory' },
  { month: 9, day: 26, name: 'Al-Quds Day', type: 'victory' },
  { month: 10, day: 1, name: 'Eid al-Fitr', type: 'victory' },
  { month: 10, day: 8, name: 'Mourning: Demolition of al-Baqi', type: 'martyrdom' },
  { month: 10, day: 10, name: 'Ghaibat Kubra of Imam al-Mahdi (atfj)', type: 'victory' },
  { month: 10, day: 15, name: 'Martyrdom: Imam Jafar al-Sadiq (as)', type: 'martyrdom' },
  { month: 10, day: 17, name: 'Battle of Uhud', type: 'victory' },
  { month: 11, day: 11, name: 'Wiladat: Imam Ali al-Rida (as)', type: 'wiladat' },
  { month: 11, day: 25, name: 'Wiladat: H. Ibrahim and H. Isa (as)', type: 'wiladat' },
  { month: 11, day: 29, name: 'Martyrdom: Imam Muhammad al-Taqi al-Jawad (as)', type: 'martyrdom' },
  { month: 12, day: 1, name: 'Wedding: Imam Ali and Syeda Fatima Zahra', type: 'wiladat' },
  { month: 12, day: 3, name: 'Allah accepted H. Adam (as) dua', type: 'victory' },
  { month: 12, day: 5, name: 'Wafat: H. Abu Dharr al-Ghifari (as)', type: 'martyrdom' },
  { month: 12, day: 7, name: 'Martyrdom: Imam Muhammad al-Baqir (as)', type: 'martyrdom' },
  { month: 12, day: 8, name: 'Imam al-Husayn left Makkah towards Karbala', type: 'martyrdom' },
  { month: 12, day: 9, name: 'Day of Arafah / Martyrdom: H. Muslim ibn Aqeel (as)', type: 'martyrdom' },
  { month: 12, day: 10, name: 'Eid al-Adha', type: 'victory' },
  { month: 12, day: 15, name: 'Wiladat: Imam Ali al-Naqi al-Hadi (as)', type: 'wiladat' },
  { month: 12, day: 18, name: 'Eid al-Ghadir', type: 'victory' },
  { month: 12, day: 19, name: 'Shab-e-Rukhsati: Syeda Fatima Zahra (as)', type: 'wiladat' },
  { month: 12, day: 22, name: 'Martyrdom: Tiflaan-e-Muslim ibn Aqeel (as)', type: 'martyrdom' },
  { month: 12, day: 24, name: 'Eid al-Mubahalah', type: 'victory' },
];

const eventIndex = new Map<string, IslamicEvent[]>();
for (const event of ISLAMIC_EVENTS) {
  const key = `${event.month}-${event.day}`;
  const list = eventIndex.get(key);
  if (list) list.push(event);
  else eventIndex.set(key, [event]);
}

export function getEventsForDay(hijriMonth: number, hijriDay: number): IslamicEvent[] {
  return eventIndex.get(`${hijriMonth}-${hijriDay}`) ?? [];
}
