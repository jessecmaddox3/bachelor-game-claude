export const RANDOM_NAMES = [
  'Alex', 'Ben', 'Charlie', 'Dan', 'Eric',
  'Frank', 'Greg', 'Henry', 'Ian', 'Jake',
  'Kevin', 'Liam', 'Mike', 'Nick', 'Owen',
  'Pete', 'Quinn', 'Ryan', 'Sam', 'Tom',
  'Vince', 'Will', 'Zach', 'Adam', 'Brad',
  'Chris', 'Dave', 'Ethan', 'Fred', 'Gabe',
  'Hank', 'Jack', 'Kyle', 'Luke', 'Matt',
  'Nate', 'Oscar', 'Pat', 'Reed', 'Sean',
];

export function getRandomNames(count: number): string[] {
  const shuffled = [...RANDOM_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
