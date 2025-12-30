import { IViolation, Violation } from "./Violation";
import { ViolationTypes } from "./ViolationType";

class ViolationFactory{
    create(type: keyof typeof ViolationTypes, payload: string, detectedAt:number = Date.now()): Violation{
        const id = `${type}-${detectedAt}-${Math.random().toString(36).substr(2, 9)}`
        return new Violation(id, type, payload,detectedAt)
    }

    fromData(data: IViolation): Violation{
        return new Violation(
            data.id,
            data.type,
            data.payload,
            data.detectedAt,
            data.dismissedUntil,
            data.context
        )
    }
}

export const violationFactory = new ViolationFactory()