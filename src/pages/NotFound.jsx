import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFound = () => (
  <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-6 py-16">
    <Helmet><title>Nie znaleziono strony | VitaZone</title><meta name="robots" content="noindex,follow" /></Helmet>
    <h1 className="text-4xl font-bold text-white">Nie znaleźliśmy tej strony</h1>
    <p className="mt-4 max-w-xl text-gray-300">Adres może być nieaktualny albo zawierać literówkę. Możesz wrócić do katalogu i wyszukać produkt.</p>
    <Link to="/shop" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-primary px-6 py-3 font-semibold text-black hover:bg-white">Przejdź do katalogu</Link>
  </section>
);

export default NotFound;
