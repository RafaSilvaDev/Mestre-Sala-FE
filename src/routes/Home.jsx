import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import Navbar from "../components/Navbar";
import "./stylesheets/Home.css";
import "react-calendar/dist/Calendar.css";
import { Spin } from "react-cssfx-loading";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import axios, {
  getReservationsByDate,
  createReservation,
} from "../servers/Api";

const Home = () => {
  const {timeZone} = Intl.DateTimeFormat().resolvedOptions();
  const todayDate = new Date(new Date().toLocaleString('en', {timeZone})).toISOString().substring(0, 10);
  const [showSpin, setShowSpin] = useState(false);
  const [selectedDay, setSelectedDay] = useState();
  const [reservations, setReservations] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      setReservations(await getReservationsByDate(todayDate));
    }
    fetchData().catch(console.error)
    setSelectedDay(todayDate);
    console.log(todayDate)
  }, []);

  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    axios
      .get("/room")
      .then((response) => {
        setRooms(response.data);
      })
      .catch(() => {
        console.log("Algo deu errado no GET de salas!");
      });
  }, []);
  const [visibleReservations, setVisibleReservations] = useState(
    Array(reservations.length).fill(false)
  );
  const [visibleNewReservation, setVisibleNewReservation] = useState(false);
  const [newReservation, setNewReservation] = useState({
    date: "",
    title: "",
    begin: "",
    end: "",
    description: "",
    user: {
      id: "",
    },
    room: {
      id: "",
    },
  });

  const [submitError, setSubmitError] = useState(false);
  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitError(false);
      console.log(newReservation);
      newReservation.user.id = localStorage.getItem("userId");
      newReservation.date = selectedDay;
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      await createReservation(newReservation, config);
      setNewReservation({
        date: "",
        title: "",
        begin: "",
        end: "",
        description: "",
        user: {
          id: "",
        },
        room: {
          id: "",
        },
      });

      setVisibleNewReservation(false);
      const updatedReservations = await getReservationsByDate(selectedDay);
      setReservations(updatedReservations);
    } catch (error) {
      setSubmitError(true);
      console.error("Erro ao criar a reserva:", error);
    }
  };

  const handleDayClick = async (value) => {
    const selectedDate = value.toISOString().substring(0, 10);
    setSelectedDay(selectedDate);
    setShowSpin(true);
    const updatedReservations = await getReservationsByDate(selectedDate);
    console.log(selectedDate)
    setReservations(updatedReservations);

    setShowSpin(false);
  };

  const handleReservationClick = (index) => {
    const updatedVisibleReservations = [...visibleReservations];
    updatedVisibleReservations[index] = !updatedVisibleReservations[index];
    setVisibleReservations(updatedVisibleReservations);
  };

  return (
    <div className="home-body">
      <Navbar />
      <div className="calendar-body">
        <Calendar onClickDay={handleDayClick} />
      </div>
      <div className="reservation-header">
        <h1 className="reservation-title">Reservas</h1>
        <Button
          label="Nova reserva"
          className="new-reservation-btn"
          onClick={() => setVisibleNewReservation(true)}
        />
        <Dialog
          header="Nova Reserva"
          visible={visibleNewReservation}
          style={{ width: "30rem" }}
          onHide={() => setVisibleNewReservation(false) && setSubmitError(false)}
          className="modal-dialog"
        >
          <div className="modal-content">
            <form onSubmit={handleReservationSubmit} className="form-panel">
              {submitError ? (
                <p className="error-on-submit">
                  Reserva conflitante com outra já agendada neste dia e nesta
                  sala!
                </p>
              ) : (
                <></>
              )}
              <label htmlFor="reservation-room">Sala</label>
              <select
                name="room"
                id="reservation-room"
                value={newReservation.room.id}
                onChange={(e) =>
                  setNewReservation({
                    ...newReservation,
                    room: { id: e.target.value },
                  })
                }
                required
              >
                <option value="" disabled selected>
                  -- Selecione uma opção --
                </option>
                {rooms.map((room, index) => (
                  <option value={room.id} key={index}>
                    {room.title}
                  </option>
                ))}
              </select>
              <label htmlFor="reservation-title">Título</label>
              <input
                type="text"
                name="title"
                id="reservation-title"
                value={newReservation.title}
                onChange={(e) =>
                  setNewReservation({
                    ...newReservation,
                    title: e.target.value,
                  })
                }
              />
              <div className="reservation-time-box">
                <div className="time-input">
                  <label htmlFor="reservation-start-time">Início</label>
                  <input
                    type="time"
                    name="begin"
                    id="reservation-start-time"
                    value={newReservation.begin}
                    onChange={(e) =>
                      setNewReservation({
                        ...newReservation,
                        begin: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="time-input">
                  <label htmlFor="reservation-end-time">Término</label>
                  <input
                    type="time"
                    name="end"
                    id="reservation-end-time"
                    value={newReservation.end}
                    onChange={(e) =>
                      setNewReservation({
                        ...newReservation,
                        end: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <label htmlFor="reservation-desc">Descrição</label>
              <textarea
                type="text"
                name="description"
                id="reservation-desc"
                className="reservation-desc"
                value={newReservation.description}
                onChange={(e) =>
                  setNewReservation({
                    ...newReservation,
                    description: e.target.value,
                  })
                }
              />
              <button type="submit" className="submit-reservation-btn">
                Reservar
              </button>
            </form>
          </div>
        </Dialog>
      </div>
      <div className="reservations-list">
        <div className="spin-loader">
          {showSpin && <Spin color="#3d9970" width="3rem" height="3rem" />}
        </div>
        {!reservations.length ? (
          <p className="empty-list-text">
            Não há reservas para este dia.
            <br />
            Experimente fazer a sua!
          </p>
        ) : (
          reservations.map((reservation, index) => (
            <>
              <div
                key={index}
                className="reservation-item"
                onClick={() => handleReservationClick(index)}
              >
                <div className="item-text">
                  <h2 className="item-title">{reservation.room.title}</h2>
                  <p className="item-subtitle">{reservation.title}</p>
                </div>
                <h3 className="item-time">
                  {reservation.begin} - {reservation.end}
                </h3>
              </div>
              <Dialog
                header={reservation.room.title}
                visible={visibleReservations[index]}
                style={{ width: "30rem" }}
                onHide={() => handleReservationClick(index)}
                className="modal-dialog"
              >
                <div className="modal-content">
                  <div className="false-input-text">
                    <p className="title">Quem Reservou</p>
                    <p className="false-input">{reservation.user.fullName}</p>
                  </div>
                  <div className="false-input-text">
                    <p className="title">Título</p>
                    <p className="false-input">{reservation.title}</p>
                  </div>
                  <div className="false-input-time-box">
                    <div className="false-input-time">
                      <p className="title">Início</p>
                      <p className="false-input">{reservation.begin}</p>
                    </div>
                    <div className="false-input-time">
                      <p className="title">Término</p>
                      <p className="false-input">{reservation.end}</p>
                    </div>
                  </div>
                  <div className="false-input-text">
                    <p className="title">Descrição</p>
                    <p className="false-input-desc">
                      {reservation.description}
                    </p>
                  </div>
                </div>
              </Dialog>
            </>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
