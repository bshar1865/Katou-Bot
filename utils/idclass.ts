import { config } from "dotenv";
config();

class IDClass {
  roleMods() {
    return [
      this.RoleOwner(),
      this.RoleMods(),
      this.KatouBot()
    ];
  }
  RoleOwner() {
    return "1101061601383153674";
  }
  RoleMods() {
    return "1101061365692649532";
  }
 
  KatouBot() { return "1103686466955128832"; }

  // Used in log channels and restrictions
  logChannel() { return "1395076496904683614"; }
  restrictedCategory() { return "1102854463288512533"; }
  channelErrorLogs() { return "1395075172989407242"; }
  welcomeChannelId() { return "1395088323302916156"; }
  rulesChannel() { return "1102957142945845370"; }
  announcementsChannel() { return "1103749009430020148"; }
  communityChannel() { return "1370154749135032340"; }
  helpChannel() { return "1395089080622256238"; }
  faqChannel() { return "1395088985096716450"; }
}

const idclass = new IDClass();
export default idclass;
