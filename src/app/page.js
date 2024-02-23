"use client";
import {
  Button,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import React from "react";
import styles from "./page.module.css";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "100%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function Home() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalPage, setModalPage] = React.useState("addDomain");
  const [domain, setDomain] = React.useState("");
  const [provider, setProvider] = React.useState("");
  const [authentication, setAuthentication] = React.useState({
    dkim: {},
    mail_server: {},
    subdomain_spf: {},
  });
  const [typeOfAuthorization, setTypeOfAuthorization] =
    React.useState("automatic");

  const closeModal = () => {
    setModalOpen(false);
  };

  const authorizeDomain = () => {
    setModalPage("processing");
    axios
      .post("/api/process-domain", { domain })
      .then((response) => {
        setAuthentication(response.data.authentication.dns);
        setModalPage("addedDetails");
      })
      .catch((error) => console.error(error.body));
  };

  const useYourOwnDomain = () => {
    // axios
    //   .get(`/api/get-authenticated-records?domain=${domain}`)
    //   .then((response) => {
    //     console.log(response.data.authentication.dns);
    //     setAuthentication(response.data.authentication.dns);
    //     setModalPage("useYourOwnDomain");
    //   });
    setTypeOfAuthorization("manual");
    getDomainDetails();
    setModalOpen("domainDetails");
  };

  const godaddyAuth = () => {
    window.open(`/api/godaddy-oauth?domain=${domain}`, "_blank");
  };

  const getDomainDetails = () => {
    axios.get(`/api/get-domain-info?domain=${domain}`).then((response) => {
      setProvider(response.data.provider);
      setModalPage("domainDetails");
    });
  };

  const renderModalContent = () => {
    const modalContentMap = new Map([
      [
        "addDomain",
        <div className={styles.modal}>
          <Typography variant="h2">Add Domain</Typography>
          <TextField
            className={styles.fullWidthInput}
            label="Domain URL"
            variant="outlined"
            required={true}
            onChange={(e) => setDomain(e.target.value)}
          />
          <div className={styles.modalButtonGroup}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={useYourOwnDomain}
            >
              Use your own domain
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                getDomainDetails();
                setModalPage("processing");
              }}
            >
              Continue
            </Button>
          </div>
        </div>,
      ],
      [
        "processing",
        <div className={styles.modal}>
          <Typography variant="h2">Processing</Typography>
          <Typography variant="body1">Processing your domain...</Typography>
        </div>,
      ],
      [
        "domainDetails",
        <div className={styles.modal}>
          <Typography variant="h2">Domain Details</Typography>
          <Typography variant="body1">Domain: {domain}</Typography>
          <Typography variant="body1">Provider: {provider}</Typography>
          <div className={styles.modalButtonGroup}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setModalPage("addDomain")}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                typeOfAuthorization === "automatic"
                  ? authorizeDomain()
                  : godaddyAuth()
              }
            >
              Authorize Domain
            </Button>
          </div>
        </div>,
      ],
      [
        "addedDetails",
        <div className={styles.modal}>
          <Typography variant="h2">Records created</Typography>
          <Typography variant="body1">
            DKIM: {authentication.dkim.host}
          </Typography>
          <Typography variant="body1">
            MX:{" "}
            {`${authentication.mail_server.host} -> ${authentication.mail_server.data}`}
          </Typography>
          <Typography variant="body1">
            SPF:{" "}
            {`${authentication.subdomain_spf.host} -> ${authentication.subdomain_spf.data}`}
          </Typography>
          <Button variant="contained" color="primary" onClick={closeModal}>
            Close
          </Button>
        </div>,
      ],
      [
        "useYourOwnDomain",
        <div className={styles.modal}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Record Type</TableCell>
                  <TableCell>Host</TableCell>
                  <TableCell>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>DKIM</TableCell>
                  <TableCell>{authentication.dkim.host}</TableCell>
                  <TableCell>{authentication.dkim.data}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>MX</TableCell>
                  <TableCell>{authentication.mail_server.host}</TableCell>
                  <TableCell>{authentication.mail_server.data}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>SPF</TableCell>
                  <TableCell>{authentication.subdomain_spf.host}</TableCell>
                  <TableCell>{authentication.subdomain_spf.data}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Button variant="contained" color="primary" onClick={closeModal}>
            Close
          </Button>
        </div>,
      ],
    ]);

    return modalContentMap.get(modalPage);
  };

  return (
    <main className={styles.main}>
      <Typography variant="h1">Domains</Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setModalOpen(true)}
      >
        + Add
      </Button>
      <Modal open={modalOpen} onClose={closeModal} sx={modalStyle}>
        {renderModalContent()}
      </Modal>
    </main>
  );
}
