import SendgridClient from "@sendgrid/client";
import axios from "axios";
import * as crypto from "node:crypto";

const {
  GODADDY_BASE_URL,
  GODADDY_OTE_DOMAIN,
  SENDGRID_API_KEY,
  GODADDY_OTE_API_KEY,
  GODADDY_OTE_API_SECRET,
  GODADDY_PRODUCTION_DOMAIN,
  GODADDY_PRODUCTION_API_KEY,
  GODADDY_PRODUCTION_API_SECRET,
  SENDGRID_DOMAIN,
} = process.env;

SendgridClient.setApiKey(SENDGRID_API_KEY);

async function createSubdomain(subdomain, ip) {
  const url = `${GODADDY_BASE_URL}/v1/domains/${GODADDY_PRODUCTION_DOMAIN}/records`;
  const generatedSubdomain = `${subdomain.toLowerCase()}`;
  const records = [
    {
      type: "CNAME",
      name: generatedSubdomain, // What is the subdomain?
      data: GODADDY_PRODUCTION_DOMAIN, // What is the ip address?
      ttl: 60000, // What is the expiration time?
    },
  ];

  const headers = {
    Authorization: `sso-key ${GODADDY_PRODUCTION_API_KEY}:${GODADDY_PRODUCTION_API_SECRET}`,
    "Content-Type": "application/json",
  };
  try {
    await axios.patch(url, records, { headers });
  } catch (error) {
    console.error(error);
  }
  return generatedSubdomain; // nothing is returned on response.data
}

async function authenticate(username, subdomain, ips) {
  const data = {
    domain: GODADDY_PRODUCTION_DOMAIN, // probably loan officer's domain
    subdomain, // probably provided by the user
    username, // probably provided by the user
    ips, // What are the ips?
    custom_spf: false,
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

async function validateAuthenticatedSubdomain(domainId) {
  const request = {
    method: "POST",
    url: `/v3/whitelabel/domains/${domainId}/validate`,
  };

  try {
    const [response, body] = await SendgridClient.request(request);
    console.log({ body });
    return body;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function addDnsRecords(domain, records) {
  const url = `${GODADDY_BASE_URL}/v1/domains/${domain}/records`;
  const headers = {
    Authorization: `sso-key ${GODADDY_PRODUCTION_API_KEY}:${GODADDY_PRODUCTION_API_SECRET}`,
    "Content-Type": "application/json",
  };

  console.log(records);

  const data = records.map((record) => ({
    type: record.type.toUpperCase(),
    name: record.host,
    data: record.data,
    ttl: 60000,
  }));

  await axios.patch(url, data, { headers });
}

async function createSendgridSubUser(username, email, password, ips) {
  const data = {
    username,
    email,
    password,
    ips,
  };

  const request = {
    url: `/v3/subusers`,
    method: "POST",
    body: data,
  };

  const [response, body] = await SendgridClient.request(request);

  console.log(body);

  return body;
}

export default async function handler(req, res) {
  const domain = req.body.domain;

  const username = crypto.randomBytes(16).toString("hex");
  const password = crypto.randomBytes(16).toString("hex");
  const ips = ["168.245.124.34"];

  await createSendgridSubUser(
    username,
    `${username}@loanofficer.ai`,
    password,
    ips
  );

  const subdomain = await createSubdomain(domain, ips[0]);

  const authentication = await authenticate(username, subdomain, ips);

  console.log({ authentication: authentication.dns });

  try {
    await addDnsRecords(
      GODADDY_PRODUCTION_DOMAIN,
      Object.values(authentication.dns)
    );
  } catch (error) {
    console.log(error.response.data.fields);
  }

  // const spfValue = authentication.dns.subdomain_spf.data;
  // const dkimValue = authentication.dns.dkim.data;

  // await createSpfAndDkimRecords(subdomain, spfValue, dkimValue);
  // const target = authentication.dns.mail_server.data;

  // await createCnameRecord(GODADDY_OTE_DOMAIN, subdomain, target);
  const domainId = authentication.id;
  const validation = await validateAuthenticatedSubdomain(domainId);
  console.log({ validation, results: validation.validation_results });

  res.status(200).json({ authentication });
}
