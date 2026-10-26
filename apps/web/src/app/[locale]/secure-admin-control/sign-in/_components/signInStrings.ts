/** Every label the sign-in steps use, resolved on the server (translations stay there). */
export type SignInStrings = {
  email: string;
  password: string;
  showPassword: string;
  hidePassword: string;
  remember: string;
  rememberHint: string;
  submit: string;
  wrong: string;
  wrongTries: string;
  lockedTitle: string;
  lockedBody: string;
  unavailable: string;
  missing: string;
  /** After the welcome page: the new password is set, sign in with it (D0 R9). */
  welcome: string;
  // Two-step sign-in (issue 234)
  codeTitle: string;
  codeLead: string;
  codeLabel: string;
  recoveryLabel: string;
  recoveryHint: string;
  useRecovery: string;
  useApp: string;
  trust: string;
  trustHint: string;
  verify: string;
  startAgain: string;
  wrongCode: string;
  expired: string;
  missingCode: string;
  enrolTitle: string;
  enrolLead: string;
  enrolApp: string;
  enrolScan: string;
  enrolKey: string;
  enrolCode: string;
  enrolSubmit: string;
  qrLabel: string;
  savedTitle: string;
  savedLead: string;
  savedConfirm: string;
  continue: string;
  codes: {
    codesLabel: string;
    copy: string;
    copied: string;
    download: string;
    fileName: string;
    fileTitle: string;
    fileNote: string;
  };
};
