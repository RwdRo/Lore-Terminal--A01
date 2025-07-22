export class BufferPolyfill extends Uint8Array {
  static from(value, encoding) {
    if (typeof value === 'number') {
      const arr = new Uint8Array(value);
      return new BufferPolyfill(arr.buffer);
    }
    if (typeof value === 'string') {
      if (encoding === 'base64') {
        const binary = atob(value);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          arr[i] = binary.charCodeAt(i);
        }
        return new BufferPolyfill(arr.buffer);
      }
      if (!encoding || encoding === 'utf8' || encoding === 'utf-8') {
        return new BufferPolyfill(new TextEncoder().encode(value).buffer);
      }
    }
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      return new BufferPolyfill(value.buffer || value);
    }
    throw new Error('Unsupported Buffer.from input');
  }
  toString(encoding) {
    if (encoding === 'base64') {
      let str = '';
      for (let i = 0; i < this.length; i++) {
        str += String.fromCharCode(this[i]);
      }
      return btoa(str);
    }
    if (!encoding || encoding === 'utf8' || encoding === 'utf-8') {
      return new TextDecoder().decode(this);
    }
    throw new Error('Unsupported Buffer.toString encoding');
  }
}

export function installBufferPolyfill() {
  if (typeof globalThis.Buffer === 'undefined') {
    globalThis.Buffer = BufferPolyfill;
  }
}
