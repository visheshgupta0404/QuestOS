import {ApiError} from './errors';
/** Maximum allowed size in bytes for a JSON request body (16 KB). */
export const MAX_JSON_BYTES=16*1024;
/**
 * Reads and parses a JSON request body with strict validation.
 * Throws ApiError(415) if the Content-Type is not application/json.
 * Throws ApiError(413) if the body exceeds MAX_JSON_BYTES.
 * Throws ApiError(400) if the body is missing or not valid JSON.
 */
export async function readJson(req:Request):Promise<unknown>{
 if(req.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new ApiError(415,'Send this request as application/json.');
 const length=Number(req.headers.get('content-length'));if(Number.isFinite(length)&&length>MAX_JSON_BYTES)throw new ApiError(413,'Request is too large.');
 const reader=req.body?.getReader();if(!reader)throw new ApiError(400,'A JSON request body is required.');
 const decoder=new TextDecoder('utf-8',{fatal:true});let bytes=0,text='';
 try {
  while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>MAX_JSON_BYTES){await reader.cancel();throw new ApiError(413,'Request is too large.');}text+=decoder.decode(chunk.value,{stream:true});}
  text+=decoder.decode();return JSON.parse(text);
 }catch(error){if(error instanceof ApiError)throw error;throw new ApiError(400,'The request body is not valid JSON.');}
 finally{reader.releaseLock();}
}
