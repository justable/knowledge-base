import qs from 'qs';

type jsonpArgs = {
  url: string;
  callback: Function;
  params: object;
};

function jsonp(args: jsonpArgs) {
  const { url, callback, params } = args;
  const script = document.createElement('script');
  const cbname = `JSONP_NS_${Math.random()
    .toString()
    .slice(2)}`;
  script.src = `${url}?${qs.stringify({ callback: cbname, ...params })}`;
  // @ts-ignore
  window[cbname] = callback;
  document.body.appendChild(script);
}

export default jsonp;
