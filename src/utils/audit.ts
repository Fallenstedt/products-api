import { RequestDto } from '../dtos/RequestDto';
import axios from 'axios';
import AppLogger from '../utils/Logger';
const logger = new AppLogger(module);

export enum HttpMethod {
    Post,
    Put,
    Delete,
    Patch,
    Get,
}

export async function auditActivity(
    req: RequestDto,
    method: HttpMethod,
    data: string
): Promise<boolean> {
    const auditUrl = process.env.AUDIT_URL as string;

    if (req.Jwt.audit == true && auditUrl?.length > 0) {
        return await sendAudit(req.Jwt.userId, method, data);
    } else {
        return true;
    }
}

// ----------------------------------------------------------
// ----------------------------------------------------------

async function sendAudit(
    userId: string,
    method: HttpMethod,
    data: string
): Promise<boolean> {
    let success: boolean = true;

    try {
        const srvcName = 'product-api';

        const body = {
            timeStamp: new Date().toISOString(),
            userId: userId,
            source: srvcName,
            method: method,
            data: data,
        };

        let strPayload = JSON.stringify(body);
        logger.debug(strPayload);

        // Specifying headers in the config object
        const reqHeader = {
            'content-type': 'application/json',
            'content-length': strPayload.length,
            'User-Agent': srvcName,
            Connection: 'keep-alive',
            'x-api-key': process.env.AUDIT_API_KEY,
        };

        const response = await axios.post(process.env.AUDIT_URL!, strPayload, {
            headers: reqHeader,
        });

        logger.debug(response.data);
    } catch (ex) {
        logger.error('Audit connection refused');
        success = false;
    }

    return success;
}
