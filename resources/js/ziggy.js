const Ziggy = {"url":"http:\/\/localhost","port":null,"defaults":{},"routes":{"home":{"uri":"\/","methods":["GET","HEAD"]},"catalog":{"uri":"catalog","methods":["GET","HEAD"]},"login":{"uri":"login","methods":["GET","HEAD"]},"cart":{"uri":"cart","methods":["GET","HEAD"]},"profile":{"uri":"profile","methods":["GET","HEAD"]},"orders":{"uri":"orders","methods":["GET","HEAD"]},"payment":{"uri":"payment","methods":["GET","HEAD"]},"product.detail":{"uri":"product\/{id}","methods":["GET","HEAD"],"parameters":["id"]},"storage.local":{"uri":"storage\/{path}","methods":["GET","HEAD"],"wheres":{"path":".*"},"parameters":["path"]}}};
if (typeof window !== 'undefined' && typeof window.Ziggy !== 'undefined') {
  Object.assign(Ziggy.routes, window.Ziggy.routes);
}
export { Ziggy };
