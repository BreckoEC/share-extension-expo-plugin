import ExpoModulesCore
import Intents

struct User: Record {
  @Field var id: String
  @Field var name: String
  @Field var email: String?
  @Field var phoneNumber: String?
  @Field var picture: String?
}

struct IntentsHelper {
  static func sendMessage(to recipients: [User],
                          from sender: User,
                          in conversationId: String,
                          groupName: String?,
                          groupPicture: String?) -> Void {
    let sender = convert(sender, isActiveUser: true)
    let recipients = recipients
      .map { convert($0, isActiveUser: false) }
      .compactMap { $0 }
    let groupName = groupName ?? recipients.reduce("") { $0 + $1.displayName + "," }

    let messageIntent = INSendMessageIntent(recipients: recipients,
                                            outgoingMessageType: .outgoingMessageText,
                                            content: nil,
                                            speakableGroupName: INSpeakableString(spokenPhrase: groupName),
                                            conversationIdentifier: conversationId,
                                            serviceName: nil,
                                            sender: sender,
                                            attachments: nil)

    if let groupPicture = groupPicture,
       let image = image(from: groupPicture)
    {
      messageIntent.setImage(image, forParameterNamed: \.speakableGroupName)
    }

    INInteraction(intent: messageIntent, response: nil).donate()
  }

  private static func convert(_ user: User, isActiveUser: Bool) -> INPerson? {
    var personHandle: INPersonHandle?
    if let email = user.email {
      personHandle = INPersonHandle(value: email, type: .emailAddress)
    } else if let phoneNumber = user.phoneNumber {
      personHandle = INPersonHandle(value: phoneNumber, type: .phoneNumber)
    } else {
      return nil
    }

    var personImage: INImage?
    if let picture = user.picture,
       let image = image(from: picture)
    {
      personImage = image
    }

    return INPerson(personHandle: personHandle!,
                    nameComponents: try? PersonNameComponents(user.name),
                    displayName: user.name,
                    image: personImage,
                    contactIdentifier: user.id,
                    customIdentifier: user.id,
                    isMe: isActiveUser)
  }

  private static func image(from url: String) -> INImage? {
    var image: INImage?
    if let pictureUrl = URL(string: url) {
      do {
        let pictureData = try Data(contentsOf: pictureUrl)
        image = INImage(imageData: pictureData)
      } catch {}
    }
    return image
  }
}
