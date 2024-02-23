import SendgridClient from "@sendgrid/client";

const { GODADDY_OTE_DOMAIN, GODADDY_PRODUCTION_DOMAIN, SENDGRID_API_KEY } =
  process.env;

SendgridClient.setApiKey(SENDGRID_API_KEY);

async function authenticate(subdomain) {
  const data = {
    domain: GODADDY_PRODUCTION_DOMAIN, // probably loan officer's domain
    subdomain, // probably provided by the user
    // username: "john@example.com", // probably provided by the user
    ips: ["127.0.0.1"], // What are the ips?
    // custom_spf: true,
    default: true,
    automatic_security: false,
  };

  const request = {
    url: `/v3/whitelabel/domains`,
    method: "POST",
    body: data,
  };

  try {
    const [response, body] = await SendgridClient.request(request);
    console.log(body);
    console.log(response.body);
    return response.body;
  } catch (error) {
    const request = {
      url: "/v3/whitelabel/domains",
      method: "GET",
    };
    const [response, body] = await SendgridClient.request(request);
    const [authentication] = body.filter(
      (auth) => auth.subdomain === subdomain
    );
    return authentication;
  }
}

export default async function handler(req, res) {
  const domain = req.query.domain;

  const authentication = await authenticate(domain);

  res.status(200).json({ authentication });
}
