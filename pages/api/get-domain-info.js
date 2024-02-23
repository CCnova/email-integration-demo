import whois from "whois";

export function getWhoIs(domain) {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export default function handler(req, res) {
  const domain = req.query.domain;
  getWhoIs(domain)
    .then((data) => {
      const [, , registrar] = data.split("\n");

      if (registrar.includes("godaddy")) {
        res.status(200).json({ provider: "GoDaddy" });
      }
      res.status(200).json({ provider: "NOT_FOUND" });
    })
    .catch((err) => {
      res.status(500).json({ err });
    });
}
