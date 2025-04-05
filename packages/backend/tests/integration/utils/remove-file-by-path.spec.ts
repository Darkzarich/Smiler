import fs from 'fs';
import { removeFileByPath } from '../../../src/utils/remove-file-by-path';

const fileName = 'test-file-to-delete.txt';

afterEach(() => {
  // Clean up: Ensure the file is deleted after each test
  if (fs.existsSync(fileName)) {
    fs.unlinkSync(fileName);
  }
});

describe('removeFileByPath', () => {
  // This test purpose is to test a file is actually deleted,
  // even when I update Node it will still test this behavior
  it('Should remove file by path', async () => {
    fs.writeFileSync(fileName, 'This is a test file.');

    await removeFileByPath(fileName);

    expect(fs.existsSync(fileName)).toBe(false);
  });
});
