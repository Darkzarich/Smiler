export default async function mockDate(
  context,
  ISOTimestamp = '2024-03-06T00:00:00.000Z',
) {
  const mockedDate = new Date(ISOTimestamp);

  await context.addInitScript(`{
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(${mockedDate.getTime()})
        } else {
          super(...args)
        }
      }
    }
    
    const __DateNowOffset = ${mockedDate.getTime()} - Date.now()
    const __DateNow = Date.now
    Date.now = () => __DateNow() + __DateNowOffset
  }`);
}
