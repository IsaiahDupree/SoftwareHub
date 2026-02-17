/**
 * macOS notarization script for electron-builder afterSign hook.
 * Only runs when APPLE_ID and APPLE_ID_PASS env vars are set (CI environment).
 */
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASS) {
    console.log('Skipping notarization: APPLE_ID not set')
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  console.log(`Notarizing ${appPath}...`)
  await notarize({
    tool: 'notarytool',
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASS,
    teamId: process.env.APPLE_TEAM_ID,
  })
  console.log('Notarization complete')
}
