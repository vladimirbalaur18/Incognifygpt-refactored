import { ViolationStrategy } from "./ViolationStrategy";
import { ViolationTypes } from "./ViolationType";



/**
 * Base class for violation strategies
 */
abstract class BaseViolationStrategy extends ViolationStrategy {
    protected abstract readonly regex: RegExp;

    constructor(
        type: ViolationTypes,
        description: string
    ) {
        super(
            type,
            (payload: string) => {
                this.regex.lastIndex = 0; // Reset regex state
                return this.regex.test(payload);
            },
            description
        );
    }

    /**
     * Gets the regex pattern for this strategy
     */
    getRegex(): RegExp {
        return this.regex;
    }
}

/**
 * Strategy for detecting email addresses
 */
export class EmailViolationStrategy extends BaseViolationStrategy {
    protected readonly regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}/gi;;

    constructor() {
        super(ViolationTypes.EMAIL_ADDRESS, 'Email');
    }
}

/**
 * Strategy for detecting phone numbers
 */
export class PhoneNumberViolationStrategy extends BaseViolationStrategy {
    protected readonly regex = /\+?[1-9]\d{1,14}/g;

    constructor() {
        super(ViolationTypes.PHONE_NUMBER, 'Phone number');
    }
}

/**
 * Strategy for detecting IP addresses
 */
export class IpAddressViolationStrategy extends BaseViolationStrategy {
    protected readonly regex = /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g;;

    constructor() {
        super(ViolationTypes.IP_ADDRESS, 'IP address');
    }
}

/**
 * Strategy for detecting URLs
 */
export class UrlViolationStrategy extends BaseViolationStrategy {
    protected readonly regex = /\bhttps?:\/\/(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?\b/gi;

    constructor() {
        super(ViolationTypes.URL, 'URL');
    }
}

// Singleton instances - reuse these instances as needed
export const emailViolationStrategy = new EmailViolationStrategy();
export const phoneNumberViolationStrategy = new PhoneNumberViolationStrategy();
export const ipAddressViolationStrategy = new IpAddressViolationStrategy();
export const urlViolationStrategy = new UrlViolationStrategy();
